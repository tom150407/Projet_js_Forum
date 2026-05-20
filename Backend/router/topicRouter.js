const express = require("express");
const router = express.Router();
const topicController = require("../controller/topicController");

router.get("/", topicController.getAllTopics);
router.post("/", topicController.createTopic);
router.get("/:id", topicController.getTopicById);
router.put("/:id", topicController.updateTopic); // NOUVEAU
router.delete("/:id", topicController.deleteTopic); // NOUVEAU
router.post("/:id/messages", topicController.replyToTopic);
router.post("/messages/:id/vote", topicController.voteMessage);
router.delete("/messages/:id", topicController.deleteMessage); // NOUVEAU

module.exports = router;
