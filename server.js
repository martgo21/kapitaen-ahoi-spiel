/* Winziger statischer Server – liefert titanic.html unter der Hauptadresse aus. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATEI = path.join(__dirname, "titanic.html");

const server = http.createServer((req, res) => {
  fs.readFile(DATEI, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("titanic.html konnte nicht geladen werden.");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("Statischer Server läuft auf Port " + PORT);
});
