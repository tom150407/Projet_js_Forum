const db = require("../config/db");

const getAllTopics = async (req, res) => {
  try {
    let { limit, page, tag } = req.query;
    let limitClause = "";
    let tagJoin = "";
    let tagWhere = "";
    let queryParams = [];

    // F-10 : Filtrer par tag
    if (tag && tag !== "all") {
      tagJoin = "JOIN topic_tags tt ON t.id = tt.topic_id";
      tagWhere = "WHERE tt.tag_id = ?";
      queryParams.push(tag);
    }

    if (limit !== "all") {
      const parsedLimit = parseInt(limit) || 10;
      const parsedPage = parseInt(page) || 1;
      limitClause = `LIMIT ${parsedLimit} OFFSET ${(parsedPage - 1) * parsedLimit}`;
    }

    const [topics] = await db.query(
      `
            SELECT t.id, t.title, t.status, t.created_at, u.username AS author 
            FROM topics t 
            JOIN users u ON t.author_id = u.id 
            ${tagJoin}
            ${tagWhere}
            ORDER BY t.created_at DESC 
            ${limitClause}
        `,
      queryParams,
    );
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const getTopicById = async (req, res) => {
  try {
    const topicId = req.params.id;
    const [topicInfo] = await db.query(
      `SELECT t.*, u.username AS author FROM topics t JOIN users u ON t.author_id = u.id WHERE t.id = ?`,
      [topicId],
    );
    if (topicInfo.length === 0)
      return res.status(404).json({ error: "Sujet introuvable." });

    // F-10: On récupère aussi les tags du topic pour les afficher
    const [tags] = await db.query(
      `SELECT tg.name FROM tags tg JOIN topic_tags tt ON tg.id = tt.tag_id WHERE tt.topic_id = ?`,
      [topicId],
    );
    topicInfo[0].tags = tags.map((t) => t.name);

    let { sort, limit, page } = req.query;
    let orderClause = "ORDER BY m.created_at DESC";
    if (sort === "oldest") orderClause = "ORDER BY m.created_at ASC";
    if (sort === "popular") orderClause = "ORDER BY score DESC";

    let limitClause = "";
    if (limit !== "all") {
      const parsedLimit = parseInt(limit) || 10;
      const parsedPage = parseInt(page) || 1;
      limitClause = `LIMIT ${parsedLimit} OFFSET ${(parsedPage - 1) * parsedLimit}`;
    }

    const [messages] = await db.query(
      `
            SELECT m.*, u.username AS author,
                (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'like') AS likes,
                (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'dislike') AS dislikes,
                ((SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'like') - (SELECT COUNT(*) FROM message_votes WHERE message_id = m.id AND vote_type = 'dislike')) AS score
            FROM messages m JOIN users u ON m.author_id = u.id WHERE m.topic_id = ? ${orderClause} ${limitClause}
        `,
      [topicId],
    );

    res.status(200).json({ topic: topicInfo[0], messages });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const createTopic = async (req, res) => {
  try {
    const { title, content, author_id, tag_id } = req.body;
    if (!title || !content || !author_id || !tag_id)
      return res
        .status(400)
        .json({ error: "Données incomplètes (Tag requis)." });

    // 1. On crée le topic
    const [result] = await db.query(
      "INSERT INTO topics (title, content, author_id) VALUES (?, ?, ?)",
      [title, content, author_id],
    );
    const newTopicId = result.insertId;

    // 2. F-10 : On lie le topic à son tag dans la table topic_tags
    await db.query("INSERT INTO topic_tags (topic_id, tag_id) VALUES (?, ?)", [
      newTopicId,
      tag_id,
    ]);

    res
      .status(201)
      .json({ message: "Topic créé avec succès !", topicId: newTopicId });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const replyToTopic = async (req, res) => {
  try {
    const { content, author_id } = req.body;
    if (!content || !author_id)
      return res.status(400).json({ error: "Message ou auteur invalide." });
    await db.query(
      "INSERT INTO messages (content, topic_id, author_id) VALUES (?, ?, ?)",
      [content, req.params.id, author_id],
    );
    res.status(201).json({ message: "Message ajouté !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const voteMessage = async (req, res) => {
  try {
    const { user_id, vote_type } = req.body;
    if (!user_id || !["like", "dislike"].includes(vote_type))
      return res.status(400).json({ error: "Vote invalide." });
    const [existingVote] = await db.query(
      "SELECT * FROM message_votes WHERE user_id = ? AND message_id = ?",
      [user_id, req.params.id],
    );

    if (existingVote.length > 0) {
      if (existingVote[0].vote_type === vote_type) {
        await db.query(
          "DELETE FROM message_votes WHERE user_id = ? AND message_id = ?",
          [user_id, req.params.id],
        );
        return res.status(200).json({ message: "Vote annulé." });
      } else {
        await db.query(
          "UPDATE message_votes SET vote_type = ? WHERE user_id = ? AND message_id = ?",
          [vote_type, user_id, req.params.id],
        );
        return res.status(200).json({ message: "Vote modifié." });
      }
    } else {
      await db.query(
        "INSERT INTO message_votes (user_id, message_id, vote_type) VALUES (?, ?, ?)",
        [user_id, req.params.id, vote_type],
      );
      return res.status(201).json({ message: "A voté !" });
    }
  } catch (error) {
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
      return res.status(404).json({ error: "Sujet introuvable." });
    if (topic[0].author_id !== user_id)
      return res.status(403).json({ error: "Action non autorisée." });
    await db.query("UPDATE topics SET title = ?, content = ? WHERE id = ?", [
      title,
      content,
      req.params.id,
    ]);
    res.status(200).json({ message: "Sujet mis à jour !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { user_id } = req.body;
    const [topic] = await db.query(
      "SELECT author_id FROM topics WHERE id = ?",
      [req.params.id],
    );
    if (topic.length === 0)
      return res.status(404).json({ error: "Sujet introuvable." });
    if (topic[0].author_id !== user_id)
      return res.status(403).json({ error: "Action non autorisée." });
    await db.query("DELETE FROM topics WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Sujet supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { user_id } = req.body;
    const [msg] = await db.query(
      "SELECT author_id, topic_id FROM messages WHERE id = ?",
      [req.params.id],
    );
    if (msg.length === 0)
      return res.status(404).json({ error: "Message introuvable." });
    const [topic] = await db.query(
      "SELECT author_id FROM topics WHERE id = ?",
      [msg[0].topic_id],
    );
    if (msg[0].author_id !== user_id && topic[0].author_id !== user_id)
      return res.status(403).json({ error: "Action non autorisée." });
    await db.query("DELETE FROM messages WHERE id = ?", [req.params.id]);
    res.status(200).json({ message: "Message supprimé." });
  } catch (error) {
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
