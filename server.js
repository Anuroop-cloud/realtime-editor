const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

const documents = {};
let users = 0;

// serve document page for any doc id
app.get("/doc/:id", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// delete document
app.delete("/doc/:id", (req, res) => {
  const { id } = req.params;
  delete documents[id];
  res.sendStatus(200);
});

io.on("connection", (socket) => {
  users++;
  io.emit("users", users);

  socket.on("join-doc", (docId) => {
    if (!documents[docId]) {
      documents[docId] = { content: "" };
    }

    socket.join(docId);
    socket.emit("load-doc", documents[docId].content);
  });

  socket.on("text-change", ({ docId, text }) => {
    if (!documents[docId]) return;

    documents[docId].content = text;
    socket.to(docId).emit("text-change", text);
  });

  socket.on("disconnect", () => {
    users--;
    io.emit("users", users);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
