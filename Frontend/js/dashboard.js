document.addEventListener("DOMContentLoaded", async () => {
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;

  // PROTECTION : Si l'utilisateur n'est pas admin, on le jette poliment sur l'accueil
  if (!currentUser || currentUser.role !== "admin") {
    alert("Accès refusé. Réservé aux chefs de meute.");
    window.location.href = "/"; // Redirection automatique vers l'accueil
    return;
  }

  // --- 1. CHARGEMENT DES UTILISATEURS (ADMIN) ---
  try {
    const res = await fetch("/api/admin/users");
    const users = await res.json();
    const tbody = document.getElementById("admin-users-list");
    if (tbody) {
      tbody.innerHTML = "";
      users.forEach((u) => {
        const banBtn =
          u.role !== "admin"
            ? `<button onclick="banUser(${u.id})" style="color:red; cursor:pointer;">Bannir (Purger)</button>`
            : "<em>Admin</em>";
        tbody.innerHTML += `<tr><td>${u.id}</td><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td>${banBtn}</td></tr>`;
      });
    }
  } catch (e) {
    console.error("Erreur utilisateurs:", e);
  }

  // --- 2. CHARGEMENT DES TOPICS (ADMIN) ---
  try {
    const res = await fetch("/api/topics?limit=all");
    const topics = await res.json();
    const tContainer = document.getElementById("admin-topics-list");
    if (tContainer) {
      tContainer.innerHTML = "";
      topics.forEach((t) => {
        tContainer.innerHTML += `
                    <div style="border:1px solid #ccc; padding:10px; margin:5px 0; display:flex; justify-content:space-between; align-items:center; border-radius:4px;">
                        <div><strong>${t.title}</strong> (Statut actuel: <span style="font-weight:bold; color:blue;">${t.status}</span>)</div>
                        <div>
                            Changer statut :
                            <select onchange="changeStatus(${t.id}, this.value)">
                                <option value="" disabled selected>Choisir...</option>
                                <option value="ouvert">Ouvert</option>
                                <option value="ferme">Fermé (lecture seule)</option>
                                <option value="archive">Archivé (caché)</option>
                            </select>
                            <button onclick="deleteTopicAdmin(${t.id})" style="color:red; margin-left:10px; cursor:pointer;">Supprimer Topic</button>
                        </div>
                    </div>
                `;
      });
    }
  } catch (e) {
    console.error("Erreur topics:", e);
  }
});

// --- FONCTIONS GLOBALES DE MODÉRATION ---
window.banUser = async (userId) => {
  if (!confirm("Bannir cet utilisateur et supprimer tout son contenu ?"))
    return;
  const admin = JSON.parse(localStorage.getItem("user"));
  await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_id: admin.id }),
  });
  window.location.reload();
};

window.changeStatus = async (topicId, status) => {
  if (!status) return;
  const admin = JSON.parse(localStorage.getItem("user"));
  await fetch(`/api/admin/topics/${topicId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_id: admin.id, status }),
  });
  window.location.reload();
};

window.deleteTopicAdmin = async (topicId) => {
  if (!confirm("Supprimer ce topic définitivement ?")) return;
  const admin = JSON.parse(localStorage.getItem("user"));
  await fetch(`/api/topics/${topicId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: admin.id }),
  });
  window.location.reload();
};
