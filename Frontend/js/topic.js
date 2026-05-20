let currentTopicId = new URLSearchParams(window.location.search).get("id");
let currentPage = 1;
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!currentTopicId)
    return (document.body.innerHTML =
      '<h2>Sujet introuvable.</h2><a href="/">Retour</a>');

  const userJson = localStorage.getItem("user");
  currentUser = userJson ? JSON.parse(userJson) : null;

  if (currentUser) {
    document.getElementById("reply-section").style.display = "block";
    document
      .getElementById("reply-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = document.getElementById("reply-content").value;
        const res = await fetch(`/api/topics/${currentTopicId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, author_id: currentUser.id }),
        });
        if (res.ok) window.location.reload();
        else alert((await res.json()).error);
      });
  } else {
    document.getElementById("login-prompt").style.display = "block";
  }

  loadMessages();
});

window.changePage = function (direction) {
  if (currentPage + direction > 0) {
    currentPage += direction;
    loadMessages();
  }
};

window.loadMessages = async function () {
  const limit = document.getElementById("msg-limit").value;
  const sort = document.getElementById("msg-sort").value;
  document.getElementById("current-page").textContent = `Page ${currentPage}`;

  try {
    const response = await fetch(
      `/api/topics/${currentTopicId}?limit=${limit}&page=${currentPage}&sort=${sort}`,
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    document.getElementById("topic-title").textContent = data.topic.title;
    document.getElementById("topic-meta").innerHTML =
      `Par <strong>${data.topic.author}</strong> le ${new Date(data.topic.created_at).toLocaleDateString("fr-FR")}`;
    // F-10 : Affichage du tag
    document.getElementById("topic-tags").textContent =
      data.topic.tags && data.topic.tags.length
        ? `🏷️ ${data.topic.tags.join(", ")}`
        : "";
    document.getElementById("topic-content").textContent = data.topic.content;

    const isTopicOwner = currentUser && currentUser.id === data.topic.author_id;
    if (isTopicOwner)
      document.getElementById("owner-controls").style.display = "block";

    const container = document.getElementById("messages-container");
    container.innerHTML = data.messages.length
      ? ""
      : "<p>Aucun message sur cette page.</p>";

    data.messages.forEach((msg) => {
      const score = msg.likes - msg.dislikes;
      const canDelete =
        isTopicOwner || (currentUser && currentUser.id === msg.author_id);
      const deleteBtnHtml = canDelete
        ? `<button onclick="deleteMsg(${msg.id})" style="color:red; font-size:0.8em; margin-left:15px;">Supprimer</button>`
        : "";

      container.innerHTML += `
                <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0;">
                    <p style="color: gray; display: flex; justify-content: space-between;">
                        <span><strong>${msg.author}</strong> le ${new Date(msg.created_at).toLocaleDateString("fr-FR")}</span>
                        ${deleteBtnHtml}
                    </p>
                    <p>${msg.content}</p>
                    <div style="font-size: 0.9em; margin-top: 10px;">
                        Score : <strong>${score}</strong>
                        <button onclick="vote(${msg.id}, 'like')" style="margin-left:10px;">👍 ${msg.likes}</button>
                        <button onclick="vote(${msg.id}, 'dislike')">👎 ${msg.dislikes}</button>
                    </div>
                </div>
            `;
    });
  } catch (err) {
    document.querySelector("main").innerHTML =
      `<p style="color:red;">❌ ${err.message}</p>`;
  }
};

window.vote = async function (messageId, voteType) {
  if (!currentUser) return alert("Connecte-toi pour voter ! 🐾");
  try {
    const res = await fetch(`/api/topics/messages/${messageId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, vote_type: voteType }),
    });
    if (res.ok) loadMessages();
  } catch (err) {
    console.error(err);
  }
};

window.deleteTopic = async function () {
  if (!confirm("Supprimer ce topic et TOUS ses messages ?")) return;
  try {
    const res = await fetch(`/api/topics/${currentTopicId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id }),
    });
    if (res.ok) window.location.href = "/";
    else alert((await res.json()).error);
  } catch (err) {
    console.error(err);
  }
};

window.editTopic = async function () {
  const newTitle = prompt(
    "Nouveau titre :",
    document.getElementById("topic-title").textContent,
  );
  if (!newTitle) return;
  const newContent = prompt(
    "Nouveau contenu :",
    document.getElementById("topic-content").textContent,
  );
  if (!newContent) return;
  try {
    const res = await fetch(`/api/topics/${currentTopicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        title: newTitle,
        content: newContent,
      }),
    });
    if (res.ok) loadMessages();
  } catch (err) {
    console.error(err);
  }
};

window.deleteMsg = async function (msgId) {
  if (!confirm("Supprimer ce coup de patte ?")) return;
  try {
    const res = await fetch(`/api/topics/messages/${msgId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id }),
    });
    if (res.ok) loadMessages();
  } catch (err) {
    console.error(err);
  }
};
