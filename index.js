/* =====================================================================
   Kapitän Ahoi! – Multiplayer-Relay-Server
   Ein sehr schlanker WebSocket-Server: er merkt sich, wer verbunden ist,
   und leitet Positions-/Ereignis-Nachrichten zwischen allen Spielern
   weiter. Keine Datenbank, kein Spielzustand auf dem Server nötig.
   ===================================================================== */
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const FARBEN = [0x2e9e5b, 0x4b86d3, 0xe0862e, 0x8e5bb5, 0xc94f7c, 0x5aa8a0, 0xd94b4b, 0xf1c40f];

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Kapitän Ahoi – Multiplayer-Server läuft. ⚓\n");
});

const wss = new WebSocket.Server({ server });

const spieler = new Map(); // id -> { ws, state, farbe, name }
let naechsteId = 1;

function sendeAn(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}
function broadcast(obj, ausser) {
  const msg = JSON.stringify(obj);
  for (const p of spieler.values()) {
    if (p.ws !== ausser && p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
  }
}

wss.on("connection", (ws) => {
  const id = "s" + naechsteId++;
  const farbe = FARBEN[Math.floor(Math.random() * FARBEN.length)];
  spieler.set(id, { ws, state: null, farbe, name: "Kapitän " + id });

  sendeAn(ws, { typ: "willkommen", id, farbe, serverZeit: Date.now() });

  // Dem Neuankömmling den aktuellen Stand aller anderen mitteilen
  for (const [oid, o] of spieler) {
    if (oid !== id && o.state) {
      sendeAn(ws, { typ: "zustand", id: oid, farbe: o.farbe, ...o.state });
    }
  }

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      return;
    }
    const p = spieler.get(id);
    if (!p) return;

    if (msg.typ === "zustand") {
      p.state = { x: msg.x, z: msg.z, richtung: msg.richtung, sinkt: !!msg.sinkt, fahrzeugTyp: msg.fahrzeugTyp || "titanic", tiefe: msg.tiefe || 0, hoehe: msg.hoehe || 0 };
      broadcast({ typ: "zustand", id, farbe: p.farbe, ...p.state }, ws);
    } else if (msg.typ === "hupe") {
      broadcast({ typ: "hupe", id }, ws);
    }
  });

  ws.on("close", () => {
    spieler.delete(id);
    broadcast({ typ: "weg", id });
  });

  ws.on("error", () => {});
});

server.listen(PORT, () => {
  console.log("Multiplayer-Server läuft auf Port " + PORT);
});
