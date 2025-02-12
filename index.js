const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let player = {};
let curplay = 'w';

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: 'chess game' });
});

io.on('connection', function (uniquesoket) {
    console.log('connected');

    if (!player.white) {
        player.white = uniquesoket.id;
        uniquesoket.emit('playerRole', 'w');
    } else if (!player.black) {
        player.black = uniquesoket.id;
        uniquesoket.emit('playerRole', 'b');
    } else {
        uniquesoket.emit('spectatorRole');
    }

    uniquesoket.on('disconnect', function () {
        if (uniquesoket.id === player.white) {
            delete player.white;
        } else if (uniquesoket.id === player.black) {
            delete player.black;
        }
    });

    uniquesoket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && uniquesoket.id !== player.white) return;
            if (chess.turn() === 'b' && uniquesoket.id !== player.black) return;

            const result = chess.move(move);
            if (result) {
                curplay = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                console.log('invalid move:', move);
                uniquesoket.emit('invalidMove', move);
            }
        } catch (error) {
            console.log('err');
            uniquesoket.emit('Invalid move', move);
        }
    });
});

server.listen(5000, function () {
    console.log('listening on port 5000');
});
