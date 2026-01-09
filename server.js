const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

const documents = {};

app.get("/doc/:id", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.delete("/doc/:id", (req, res) => {
  const { id } = req.params;
  delete documents[id];
  res.sendStatus(200);
});

io.on("connection", (socket) => {
  socket.on("join-doc", ({ docId, username }) => {
    if (!documents[docId]) {
      documents[docId] = { content: "" };
    }

    socket.join(docId);
    socket.docId = docId;
    socket.username = username;

    socket.emit("load-doc", documents[docId].content);
    socket.to(docId).emit("user-joined", username);
  });

  socket.on("text-change", ({ docId, text }) => {
    if (!documents[docId]) return;

    documents[docId].content = text;
    socket.to(docId).emit("text-change", text);
  });

  socket.on("disconnect", () => {
    if (socket.docId && socket.username) {
      socket.to(socket.docId).emit("user-left", socket.username);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
