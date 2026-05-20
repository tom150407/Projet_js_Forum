const db = require("../config/db");

const getAllTopics = async (req, res) => {
  try {
    let { limit, page, tag, search } = req.query;
    let limitClause = "",
      whereClauses = [],
      queryParams = [];

    // On n'affiche pas les topics archivés sur l'accueil !
    whereClauses.push("t.status != 'archive'");

    if (tag && tag !== "all") {
      whereClauses.push("tt.tag_id = ?");
      queryParams.push(tag);
    }
    if (search) {
      whereClauses.push("(t.title LIKE ? OR tg.name LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    let whereSql = "WHERE " + whereClauses.join(" AND ");
    if (limit !== "all") {
      limitClause = `LIMIT ${parseInt(limit) || 10} OFFSET ${((parseInt(page) || 1) - 1) * (parseInt(limit) || 10)}`;
    }

    const [topics] = await db.query(
      `
            SELECT DISTINCT t.id, t.title, t.status, t.created_at, u.username AS author 
            FROM topics t JOIN users u ON t.author_id = u.id LEFT JOIN topic_tags tt ON t.id = tt.topic_id LEFT JOIN tags tg ON tt.tag_id = tg.id
            ${whereSql} ORDER BY t.created_at DESC ${limitClause}
        `,
      queryParams,
    );
    res.json(topics);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const getTopicById = async (req, res) => {
  try {
    const [topicInfo] = await db.query(
      `SELECT t.*, u.username AS author FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = ?`,
      [req.params.id],
    );
    if (topicInfo.length === 0)
      return res.status(404).json({ error: "Sujet introuvable." });
    const [tags] = await db.query(
      `SELECT tg.name FROM tags tg JOIN topic_tags tt ON tg.id = tt.tag_id WHERE tt.topic_id = ?`,
      [req.params.id],
    );
    topicInfo[0].tags = tags.map((t) => t.name);

    let { sort, limit, page } = req.query;
    let orderClause = "ORDER BY m.created_at DESC";
    if (sort === "oldest") orderClause = "ORDER BY m.created_at ASC";
    if (sort === "popular") orderClause = "ORDER BY score DESC";
    let limitClause = "";
    if (limit !== "all")
      limitClause = `LIMIT ${parseInt(limit) || 10} OFFSET ${((parseInt(page) || 1) - 1) * (parseInt(limit) || 10)}`;

    const [messages] = await db.query(
      `
            SELECT m.*, u.username AS author,
                (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'like') AS likes,
                (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'dislike') AS dislikes,
                ((SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'like') - (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'dislike')) AS score
            FROM messages m JOIN users u ON m.author_id = u.id WHERE m.topic_id = ? ${orderClause} ${limitClause}
        `,
      [req.params.id],
    );
    res.json({ topic: topicInfo[0], messages });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const createTopic = async (req, res) => {
  try {
    const { title, content, author_id, tag_id } = req.body;
    const [result] = await db.query(
      "INSERT INTO topics (title, content, author_id) VALUES (?, ?, ?)",
      [title, content, author_id],
    );
    await db.query("INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)", [
      result.insertId,
      tag_id,
    ]);
    res.status(201).json({ message: "Topic créé !", topicId: result.insertId });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const replyToTopic = async (req, res) => {
  try {
    const { content, author_id } = req.body;
    // On vérifie que le topic n'est pas fermé !
    const [topic] = await db.query("SELECT status FROM topics WHERE id = ?", [
      req.params.id,
    ]);
    if (topic[0].status === "ferme")
      return res.status(403).json({ error: "Ce topic est fermé." });

    await db.query(
      "INSERT INTO messages (content, topic_id, author_id) VALUES (?, ?, ?)",
      [content, req.params.id, author_id],
    );
    res.status(201).json({ message: "Message ajouté !" });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const voteMessage = async (req, res) => {
  try {
    const { user_id, vote_type } = req.body;
    const [existing] = await db.query(
      "SELECT * FROM message_votes WHERE user_id = ? AND message_id = ?",
      [user_id, req.params.id],
    );
    if (existing.length > 0) {
      if (existing[0].vote_type === vote_type) {
        await db.query(
          "DELETE FROM message_votes WHERE user_id = ? AND message_id = ?",
          [user_id, req.params.id],
        );
        return res.json({ message: "Vote annulé." });
      } else {
        await db.query(
          "UPDATE message_votes SET vote_type = ? WHERE user_id = ? AND message_id = ?",
          [vote_type, user_id, req.params.id],
        );
        return res.json({ message: "Vote modifié." });
      }
    } else {
      await db.query(
        "INSERT INTO message_votes (user_id, message_id, vote_type) VALUES (?, ?, ?)",
        [user_id, req.params.id, vote_type],
      );
      return res.status(201).json({ message: "A voté !" });
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur interne." });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { title, content, user_id } = req.body;
    const [topic] = await db.query(
      "SELECT author_id FROM topics WHERE id = ?",
      [req.params.id],
    );
    if (topic.length === 0)
      return res.status(404).json({ error: "Introuvable." });
    if (topic[0].author_id !== user_id)
      return res.status(403).json({ error: "Action non autorisée." });
    await db.query("UPDATE topics SET title = ?, content = ? WHERE id = ?", [
      title,
      content,
      req.params.id,
    ]);
    res.json({ message: "Sujet mis à jour !" });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { user_id } = req.body;
    const [user] = await db.query("SELECT role FROM users WHERE id = ?", [
      user_id,
    ]);
    const isAdmin = user.length && user[0].role === "admin";

    const [topic] = await db.query(
      "SELECT author_id FROM topics WHERE id = ?",
      [req.params.id],
    );
    if (topic.length === 0)
      return res.status(404).json({ error: "Introuvable." });
    if (topic[0].author_id !== user_id && !isAdmin)
      return res.status(403).json({ error: "Action non autorisée." });

    await db.query("DELETE FROM topics WHERE id = ?", [req.params.id]);
    res.json({ message: "Sujet supprimé avec succès." });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { user_id } = req.body;
    const [user] = await db.query("SELECT role FROM users WHERE id = ?", [
      user_id,
    ]);
    const isAdmin = user.length && user[0].role === "admin";

    const [msg] = await db.query(
      "SELECT author_id, topic_id FROM messages WHERE id = ?",
      [req.params.id],
    );
    if (msg.length === 0)
      return res.status(404).json({ error: "Introuvable." });
    const [topic] = await db.query(
      "SELECT author_id FROM topics WHERE id = ?",
      [msg[0].topic_id],
    );

    if (
      msg[0].author_id !== user_id &&
      topic[0].author_id !== user_id &&
      !isAdmin
    )
      return res.status(403).json({ error: "Action non autorisée." });
    await db.query("DELETE FROM messages WHERE id = ?", [req.params.id]);
    res.json({ message: "Message supprimé." });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

module.exports = {
  getAllTopics,
  createTopic,
  getTopicById,
  replyToTopic,
  voteMessage,
  updateTopic,
  deleteTopic,
  deleteMessage,
};
