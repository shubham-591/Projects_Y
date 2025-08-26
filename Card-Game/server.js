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

let game = {
    players: {},
    pile: [],
    turn: null
}

function createDeck() {
    let deck = [];
    const suits = ["♥", "♦", "♣", "♠"];
    const cardNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    for (let s of suits) {
        for (let cN of cardNumbers) {
            deck.push({
                cardNumber: cN,
                suit: s,
            })
        }
    }
    // console.log(deck);
    return deck;
}

function shuffle(deck) {
    for (let i = 0; i < deck.length; i++) {
        const j = Math.floor(Math.random() * (deck.length));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function getCount(game) {
    let result = {};
    for (let id in game.players) {
        result[game.players[id].playerName] = game.players[id].cards.length;
    }
    console.log("result : ", result);
    
    return result;
}

function isMatch(card, pile) {
//   if (pile.length === 0) return false; 
//   const topCard = pile[pile.length - 1]; 
//   return topCard.cardNumber === card.cardNumber;
    if (pile.length < 2) return false;
    const top = pile[pile.length - 1];      
    const secondTop = pile[pile.length - 2]; 
    return top.cardNumber === secondTop.cardNumber;
}

function getOpponent(game, id) {
    let ids = Object.keys(game.players);
    let opponentId = ids.find(pid => pid !== id);
    return { id: opponentId, ...game.players[opponentId] };
}

function resetGame(game) {
    game.players = {};
    game.pile = [];
    game.turn = null;
}

function startGame() {
    let deck = shuffle(createDeck());
    let splitCards = deck.length / 2;
    let playerIds = Object.keys(game.players);
    const [player1, player2] = playerIds;

    game.players[player1].cards = deck.slice(0, splitCards);
    game.players[player2].cards = deck.slice(splitCards);

    game.turn = playerIds[Math.floor(Math.random() * 2)];
    console.log(game);
    console.log(game.players[player1].cards);


    io.emit('gameStart', {
        players: {
            player1: game.players[player1].playerName,
            player2: game.players[player2].playerName
        },
        counts: getCount(game),
        firstTurnId: game.turn,
        firstTurnName: game.players[game.turn].playerName,
    })
}


io.on('connection', (socket) => {
    console.log('A user is connected :', socket.id);

    socket.on('joinGame', (playerName) => {
        game.players[socket.id] = { playerName, cards: [] };

        io.emit("player-joined", { playerName });

        if (Object.keys(game.players).length === 2) {
            startGame();
        }
    });

    socket.on('play-card', () => {
        if (game.turn !== socket.id) {
            return;
        }

        let player = game.players[socket.id];

        if (player.cards.length === 0) return;

        let card = player.cards.shift();
        console.log("Card :", card);
        
        game.pile.push(card);

        if (isMatch(card, game.pile)) {
            player.cards.push(...game.pile);
            game.pile = [];

            io.emit('round-result', {
                winnerOfRound: player.playerName,
                lastMatchedCard: card,   
                pile: [],     
                count: getCount(game)
            })
        } else {
            io.emit("round-result", {
                pile: game.pile,
                count: getCount(game),
            });
        }

        // check win condition
        if (player.cards.length === 0) {
            let opponent = getOpponent(game, socket.id);
            io.emit("game-over", { winner: opponent.playerName });
            resetGame(game);
            return;
        }

        // switch turn
        game.turn = getOpponent(game, socket.id).id;
    })

    socket.on('disconnect', () => {
        delete game.players[socket.id];
        console.log('A user is disconnected :', socket.id);
    });
});

server.listen(4000, () => {
    console.log(`Server is listening on http://localhost:4000`);
})