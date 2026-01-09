const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public", { index: false }));

const documents = {};

function generatePasskey() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function updateViewerCount(docId) {
  const doc = documents[docId];
  if (!doc) return;
  const count = doc.viewers ? doc.viewers.size : 0;
  io.to(docId).emit("viewers", count);
}

app.get("/doc/:id", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.delete("/doc/:id", (req, res) => {
  const { id } = req.params;
  const { username } = req.body || {};
  const doc = documents[id];

  if (!doc) {
    return res.sendStatus(404);
  }

  if (doc.creator && doc.creator !== username) {
    return res.sendStatus(403);
  }

  delete documents[id];
  io.to(id).emit("doc-deleted");
  io.socketsLeave(id);
  return res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/home.html");
});


io.on("connection", (socket) => {
  socket.on("join-doc", ({ docId, username, passkey }) => {
    const createdNow = !documents[docId];

    if (createdNow) {
      documents[docId] = { content: "", creator: username, viewers: new Set(), passkey: generatePasskey() };
    }

    const doc = documents[docId];
    if (!doc.viewers) doc.viewers = new Set();

    // Require passkey for existing docs (including creator re-joins)
    if (!createdNow && doc.passkey && passkey !== doc.passkey) {
      socket.emit("join-denied", "Invalid passkey");
      return;
    }

    doc.viewers.add(socket.id);

    socket.join(docId);
    socket.docId = docId;
    socket.username = username;

    const creatorPasskey = username === doc.creator ? doc.passkey : undefined;

    socket.emit("load-doc", { content: doc.content, creator: doc.creator, viewers: doc.viewers.size, passkey: creatorPasskey });
    socket.to(docId).emit("user-joined", username);
    updateViewerCount(docId);
  });

  socket.on("text-change", ({ docId, text }) => {
    if (!documents[docId]) return;

    documents[docId].content = text;
    socket.to(docId).emit("text-change", text);
  });

  socket.on("disconnect", () => {
    if (socket.docId && socket.username) {
      const doc = documents[socket.docId];
      if (doc && doc.viewers) {
        doc.viewers.delete(socket.id);
      }
      socket.to(socket.docId).emit("user-left", socket.username);
      updateViewerCount(socket.docId);
    }
  });

  socket.on("leave-doc", ({ docId, username }) => {
    if (!docId) return;

    const doc = documents[docId];
    if (doc && doc.viewers) {
      doc.viewers.delete(socket.id);
    }

    socket.leave(docId);
    socket.docId = null;
    socket.to(docId).emit("user-left", username || socket.username);
    updateViewerCount(docId);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
