const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io")

const app = express();
const server = http.createServer(app);
const io = new Server(server );

app.use(express.static("/public"));

io.on("connection", (socket) => {
    console.log('A user has been connected :', socket.id);

    socket.on('pointer-move', ({x , y}) => {
        // console.log(x, y);
        
        socket.broadcast.emit('update-position', { id: socket.id, x, y});
    }); 

    socket.on('disconnect', () => {
        console.log("A user has been disconnected :", socket.id);
    })

});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
})

server.listen(3001, () => {
    console.log(`Server is listening on http://localhost:3001`);
})