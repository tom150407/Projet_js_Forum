const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

promisePool
  .getConnection()
  .then((connection) => {
    console.log("🐾 Base de données forum_pattes connectée avec succès !");
    connection.release();
  })
  .catch((err) => console.error("❌ Erreur BDD :", err.message));

module.exports = promisePool;
