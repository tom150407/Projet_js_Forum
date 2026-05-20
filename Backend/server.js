const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = require("./config/db");
const authRouter = require("./router/authRouter");
const topicRouter = require("./router/topicRouter");
const tagRouter = require("./router/tagRouter");
const adminRouter = require("./router/adminRouter"); // NOUVEAU

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRouter);
app.use("/api/topics", topicRouter);
app.use("/api/tags", tagRouter);
app.use("/api/admin", adminRouter); // NOUVEAU

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/index.html")),
);
app.listen(PORT, () =>
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`),
);
