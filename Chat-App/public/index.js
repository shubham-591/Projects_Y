// server.js
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
});

let users = {}; // { username: socket.id }

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("new-user", (username) => {
        socket.username = username;
        users[username] = socket.id;

        console.log(`${username} joined with ID ${socket.id}`);

        io.emit("user-list", Object.keys(users)); // send updated user list to all
        io.emit("user-joined", username);
    });

    socket.on("chat-message", (message) => {
        // Public message to all
        io.emit("chat-message", `${socket.username}: ${message}`);
    });

    socket.on("private-message", ({ to, message }) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("private-message", {
                from: socket.username,
                message,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.username);
        // remove user from the list
        if (socket.username) {
            delete users[socket.username];
            io.emit("user-list", Object.keys(users));
        }
    });
});

server.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});




// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Private Chat App</title>
// </head>
// <body>
//     <h1>Private Chat App</h1>

//     <div>
//         <input type="text" id="message" placeholder="Type message">
//         <button id="sendBtn">Send Public Message</button>
//     </div>

//     <h3>Online Users</h3>
//     <ul id="userList"></ul>

//     <h3>Messages</h3>
//     <div id="messages"></div>

//     <script src="/socket.io/socket.io.js"></script>
//     <script>
//         const socket = io();
//         const sendBtn = document.getElementById("sendBtn");
//         const inputField = document.getElementById("message");
//         const messages = document.getElementById("messages");
//         const userList = document.getElementById("userList");

//         const username = prompt("Enter your name:");
//         socket.emit("new-user", username);

        // // Display list of online users
        // socket.on("user-list", (users) => {
        //     userList.innerHTML = "";
        //     users.forEach(user => {
        //         if (user !== username) {
        //             const li = document.createElement("li");
        //             li.textContent = user;
        //             li.style.cursor = "pointer";
        //             li.onclick = () => {
        //                 const pm = prompt(`Enter private message for ${user}`);
        //                 if (pm) {
        //                     socket.emit("private-message", { to: user, message: pm });
        //                 }
        //             };
        //             userList.appendChild(li);
        //         }
        //     });
        // });

//         socket.on("user-joined", (name) => {
//             const p = document.createElement("p");
//             p.textContent = `${name} joined the chat`;
//             messages.appendChild(p);
//         });

//         // Public messages
//         sendBtn.addEventListener("click", () => {
//             if (inputField.value) {
//                 socket.emit("chat-message", inputField.value);
//                 inputField.value = "";
//             }
//         });

//         socket.on("chat-message", (message) => {
//             const p = document.createElement("p");
//             p.textContent = message;
//             messages.appendChild(p);
//         });

//         // Private messages
//         socket.on("private-message", ({ from, message }) => {
            // const p = document.createElement("p");
            // p.style.color = "red";
            // p.textContent = `(Private) ${from}: ${message}`;
            // messages.appendChild(p);
//         });
//     </script>
// </body>
// </html>
