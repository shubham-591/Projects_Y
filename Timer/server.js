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

let player1Timer;
let player2Timer;
let currentPlayer;
let timer;

io.on('connection', (socket) => {
    console.log('A user is connected :', socket.id);
    
    socket.on('startGame', () => {
        player1Timer = 10;
        player2Timer = 10;
        currentPlayer = 'p1';
        startYourTurn(currentPlayer);
    });

    socket.on('stop', () => {
        clearInterval(timer);
        currentPlayer = currentPlayer === 'p1' ? 'p2' : 'p1';
        startYourTurn(currentPlayer);
    })

    socket.on('disconnect', () => {
        clearInterval(timer);
        console.log('A user is disconnected :', socket.id);
    });
})

function startYourTurn(player) {
    clearInterval(timer);
    timer = setInterval(() => {
        if(player === 'p1') {
            player1Timer--;
        } else {
            player2Timer--;
        }

        io.emit('updateTimer', {
            player1Timer,
            player2Timer
        });

        if((player === 'p1' && player1Timer <= 0) || (player === 'p2' && player2Timer <= 0)) {
            clearInterval(timer);
            io.emit('gameOver', {winner : player === 'p1' ? 'p2' : 'p1'});
        }
    }, 1000);
}


server.listen(4000, () => {
    console.log(`Server is listening on http://localhost:4000`);  
})