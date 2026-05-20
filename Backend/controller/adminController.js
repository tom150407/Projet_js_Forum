const db = require("../config/db");

// Vérifie que l'utilisateur est bien admin
const checkAdmin = async (admin_id) => {
  const [users] = await db.query("SELECT role FROM users WHERE id = ?", [
    admin_id,
  ]);
  return users.length > 0 && users[0].role === "admin";
};

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, role, created_at FROM users",
    );
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const banUser = async (req, res) => {
  try {
    const { admin_id } = req.body;
    if (!(await checkAdmin(admin_id)))
      return res.status(403).json({ error: "Accès refusé." });

    // Grâce au ON DELETE CASCADE, supprimer l'utilisateur supprime ses topics, messages et likes !
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Compte banni et purgé avec succès." });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const updateTopicStatus = async (req, res) => {
  try {
    const { admin_id, status } = req.body; // status: 'ouvert', 'ferme', 'archive'
    if (!(await checkAdmin(admin_id)))
      return res.status(403).json({ error: "Accès refusé." });

    await db.query("UPDATE topics SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.status(200).json({ message: `Le topic est maintenant ${status}.` });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { getUsers, banUser, updateTopicStatus };
