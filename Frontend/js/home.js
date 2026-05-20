let currentPage = 1;

document.addEventListener("DOMContentLoaded", async () => {
  const userJson = localStorage.getItem("user");
  const userInfoDiv = document.getElementById("user-info");
  const createTopicSection = document.getElementById("create-topic-section");
  let currentUser = null;

  // --- LOGIQUE DE BIENVENUE & ACCÈS ADMIN (F-11) ---
  if (userJson) {
    currentUser = JSON.parse(userJson);

    // Si l'utilisateur est admin, on lui crée un bouton discret pour accéder au dashboard
    let adminBtn =
      currentUser.role === "admin"
        ? `<a href="/dashboard.html"><button style="margin-left:15px; background:black; color:white; border-radius:3px; cursor:pointer;">⚙️ Dashboard Admin</button></a>`
        : "";

    userInfoDiv.innerHTML = `
            <p>Bienvenue dans la meute, <strong>${currentUser.username}</strong> ! 
            <button id="logout-btn" style="margin-left: 10px;">Déconnexion</button>
            ${adminBtn}</p>
        `;
    createTopicSection.style.display = "block";

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.reload();
    });
  } else {
    userInfoDiv.innerHTML = `<p><a href="/auth.html">Connecte-toi ou inscris-toi</a> pour lancer une discussion.</p>`;
  }

  // --- CHARGEMENT DYNAMIQUE DES TAGS (F-10) ---
  try {
    const res = await fetch("/api/tags");
    const tags = await res.json();
    const tagFilter = document.getElementById("tag-filter");
    const topicCategory = document.getElementById("topic-category");

    tags.forEach((tag) => {
      tagFilter.innerHTML += `<option value="${tag.id}">${tag.name}</option>`;
      if (topicCategory)
        topicCategory.innerHTML += `<option value="${tag.id}">${tag.name}</option>`;
    });
  } catch (err) {
    console.error("Erreur chargement tags", err);
  }

  // --- FORMULAIRE DE CRÉATION DE TOPIC ---
  const createTopicForm = document.getElementById("create-topic-form");
  if (createTopicForm) {
    createTopicForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("topic-title").value;
      const content = document.getElementById("topic-content").value;
      const tag_id = document.getElementById("topic-category").value;

      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            author_id: currentUser.id,
            tag_id,
          }),
        });
        if (res.ok) window.location.reload();
        else alert((await res.json()).error);
      } catch (err) {
        alert("Erreur serveur.");
      }
    });
  }

  loadTopics();
});

// --- NAVIGATION ENTRE LES PAGES (F-9) ---
window.changePage = function (direction) {
  if (currentPage + direction > 0) {
    currentPage += direction;
    loadTopics();
  }
};

// --- CHARGEMENT ET AFFICHAGE DES TOPICS (F-9, F-10, F-12) ---
window.loadTopics = async function () {
  const limit = document.getElementById("topic-limit").value;
  const tag = document.getElementById("tag-filter").value;
  const search = document.getElementById("search-input").value;

  document.getElementById("current-page").textContent = `Page ${currentPage}`;
  const topicsContainer = document.getElementById("topics-container");

  try {
    const res = await fetch(
      `/api/topics?limit=${limit}&page=${currentPage}&tag=${tag}&search=${encodeURIComponent(search)}`,
    );
    const topics = await res.json();
    topicsContainer.innerHTML = topics.length
      ? ""
      : "<p>Aucune discussion trouvée.</p>";

    topics.forEach((t) => {
      topicsContainer.innerHTML += `
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius:4px;">
                    <h3><a href="/topic.html?id=${t.id}">${t.title}</a></h3>
                    <p>Par <strong>${t.author}</strong> le ${new Date(t.created_at).toLocaleDateString("fr-FR")} - Statut : <strong>${t.status}</strong></p>
                </div>
            `;
    });
  } catch (err) {
    topicsContainer.innerHTML = "<p>Erreur de chargement.</p>";
  }
};
