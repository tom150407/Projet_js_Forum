const http = require("http");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Le serveur Node fonctionne !");
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Serveur actif sur http://127.0.0.1:3000/");
});
