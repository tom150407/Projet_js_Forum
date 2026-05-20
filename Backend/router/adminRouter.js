const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.banUser);
router.put("/topics/:id/status", adminController.updateTopicStatus);
module.exports = router;
