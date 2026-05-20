const express = require("express");
const router = express.Router();
const tagController = require("../controller/tagController");

router.get("/", tagController.getAllTags);

module.exports = router;
