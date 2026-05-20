const db = require("../config/db");

const getAllTags = async (req, res) => {
  try {
    const [tags] = await db.query("SELECT * FROM tags");
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = { getAllTags };
