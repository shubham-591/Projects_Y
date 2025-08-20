const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// This object will contain the name of user and its socket.id
let users = {};

// This object will contain the groupname and the members array.
let groups = {};

io.on('connection', (socket) => {
    console.log('A user is connected :', socket.id);

    socket.on('new-user', (person) => {
        socket.username = person;
        users[person] = socket.id;

        io.emit('users-list', Object.keys(users));
        io.emit('user-joined', person); 
    })

    // socket.on('chat-message', (message) => {
    //     // console.log("Message is :", message);
    //     io.emit('chat-message', message);
    // });

    socket.on('private-message', ({to, message}) => {
        const receiverId = users[to];
        if(receiverId) {
            console.log(receiverId);
            io.to(receiverId).emit('private-message', {from : socket.username, message: message});
        }
    });

    socket.on('join-group', (groupName) => {
        socket.join(groupName);
        if (!groups[groupName]) groups[groupName] = [];
        if (!groups[groupName].includes(socket.username)) {
            groups[groupName].push(socket.username);
        }
        io.emit('groups-list', Object.keys(groups)); 
    });

    socket.on('group-message', ({ group, message }) => {
        io.to(group).emit('group-message', { from: socket.username, group, message });
    });

    socket.on('disconnect', () => {
        console.log('A user is disconnected :', socket.id);
    });

});

server.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');    
})



 