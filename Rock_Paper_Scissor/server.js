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

let users = {};
let turns = {};
let score1 = 0;
let score2 = 0;

function getRandom() {
    const symbols = ['rock', 'paper', 'scissor'];
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function checkWinner() {
    const userIds = Object.keys(users);
    const [player1, player2] = userIds;
    const player1Symbol = users[player1];
    const player2Symbol = users[player2];

    let result;
    if (player1Symbol === player2Symbol) {
        result = "Draw";
    } else if ((player1Symbol === 'rock' && player2Symbol === 'scissor') ||
        (player1Symbol === 'paper' && player2Symbol === 'rock') ||
        (player1Symbol === 'scissor' && player2Symbol === 'paper')) {
            result = `Player ${player1} wins`;
            score1++;
    } else {
            result = `Player ${player2} wins`;
            score2++;
    }

    io.emit("per-round-result", {
        result,
        scores: { player1: score1, player2: score2 }
    });
    
    users = {};
    turns = {};
    
    if (score1 === 10 || score2 === 10) {
        const winner = score1 === 10 ? "Player 1" : "Player 2";
        io.emit("gameOver", { winner });
        score1 = 0;
        score2 = 0;
    }
}

io.on('connection', (socket) => {
    console.log('A user is connected :', socket.id);

    socket.on('make-move', () => {
        
        // if(Object.keys(users).length > 2 && !users[socket.id]) {
        //     socket.emit('game-error', 'Game has two players already');
        //     socket.disconnect();
        // }
        // userIds[socket.id] = socket.id;

        // if(userIds[socket.id] && !flag) {
        //     flag = true;
        // }

        if(turns[socket.id]) {
            socket.emit('button-disabled');
            return;
        }

        users[socket.id] = getRandom();
        turns[socket.id] = true;
        socket.emit('button-disabled');

        io.emit("update-status", users);

        if (Object.keys(users).length === 2) {
            checkWinner();
            io.emit('button-enabled');
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        console.log('A user is disconnected :', socket.id);
    });
});

server.listen(4000, () => {
    console.log(`Server is listening on http://localhost:4000`);
})