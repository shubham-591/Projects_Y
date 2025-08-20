const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = [];
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';

app.use(express.static(path.join(__dirname, "./public")));

    app.get("/", (req, res) => {
        res.sendFile(__dirname + '/public/index.html');
    });

const checkWinner = () => {
    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let combination of winningConditions) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return boardState[a];
        }
    }
    return boardState.includes('') ? null : 'Draw';
}

io.on('connection', (socket) => {
    console.log('A user is connected :', socket.id);
    // if(players.length < 2) {
    //     players.push({
    //         id: socket.id,
    //         symbol: players.length === 0 ? 'X' : 'O'
    //     });
    //     socket.emit('assignSymbol', players[players.length - 1].symbol);
    // } else {
    //     socket.emit('spectator');
    // }
    
    if (players.length < 2) {
        let symbol = players.some(p => p.symbol === 'X') ? 'O' : 'X';

        players.push({ id: socket.id, symbol });

        socket.emit('assignSymbol', symbol);
    } else {
        socket.emit('spectator');
    }

    if (players.length !== 2) {
        boardState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
    }

    io.emit('updatePlayers', players.map(player => player.symbol));

    socket.on('makeMove', (data) => {
        if(socket.id === players.find(player => player.symbol === currentPlayer)?.id) {
            boardState[data.index] = data.player;
            io.emit('moveMade', data);
            const winner = checkWinner();
            if(winner) {
                io.emit('gameOver', { winner });
                boardState = ['', '', '', '', '', '', '', '', ''];
                currentPlayer = 'X';
                io.emit('updatePlayers', players.map(player => player.symbol));
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    });

    socket.on('disconnect', () => {
        // io.emit('resetGame');
        console.log('A user is disconnected :', socket.id);
        boardState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        players = players.filter(player => player.id !== socket.id);
        console.log("Players :", players);
        io.emit('updatePlayers', players.map(player => player.symbol));
        // io.emit('resetGame');
        // console.log("dfadfa");
        // socket.emit('resetGame');
        socket.broadcast.emit('resetGame');
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');    
})





