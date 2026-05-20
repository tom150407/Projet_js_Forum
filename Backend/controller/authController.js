const db = require("../config/db");
const crypto = require("crypto");

const hashPassword = (password) => {
  return crypto.createHash("sha512").update(password).digest("hex");
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Le mot de passe nécessite 8 caractères, 1 majuscule et 1 caractère spécial.",
      });
    }

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email],
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ error: "Ce pseudo ou email est déjà utilisé." });
    }

    const hashedPassword = hashPassword(password);
    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
    );

    res
      .status(201)
      .json({ message: "Inscription réussie ! Bienvenue dans la meute." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Identifiant ou mot de passe manquant." });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [identifier, identifier],
    );
    if (users.length === 0) {
      return res.status(401).json({ error: "Animal inconnu." });
    }

    const user = users[0];
    if (hashPassword(password) !== user.password_hash) {
      return res.status(401).json({ error: "Mauvais mot de passe." });
    }

    res.status(200).json({
      message: `Connexion réussie, ${user.username} ! 🐾`,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

module.exports = { register, login };
