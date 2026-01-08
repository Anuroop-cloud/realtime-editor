const { disconnect } = require("cluster");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let sharedText = "";

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("init", sharedText);

  socket.on("text-change", (data) => {
    if (typeof data !== "string") return;
    sharedText = data;
    socket.broadcast.emit("text-change", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

let users=0;
io.on("connection",(socket)=>{
    users++;
    io.emit("users",users);

    socket.on("disconnect",()=>{
        users--;
        io.emit("users",users);
    })
})

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
