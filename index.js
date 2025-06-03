const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');
require('dotenv').config(); // For .env file if needed

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};
let currentTurn = 'w';

// Set view engine
app.set('view engine', 'ejs');

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Route: homepage
app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign player roles
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit('spectatorRole');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.id === players.white) delete players.white;
        if (socket.id === players.black) delete players.black;
    });

    // Handle chess moves
    socket.on('move', (move) => {
        try {
            const isWhiteTurn = chess.turn() === 'w';
            const isValidPlayer =
                (isWhiteTurn && socket.id === players.white) ||
                (!isWhiteTurn && socket.id === players.black);

            if (!isValidPlayer) return;

            const result = chess.move(move);
            if (result) {
                currentTurn = chess.turn();
                io.emit('move', move); // Broadcast move
                io.emit('boardState', chess.fen()); // Send updated board
            } else {
                socket.emit('invalidMove', move);
            }
        } catch (err) {
            console.error('Error processing move:', err);
            socket.emit('invalidMove', move);
        }
    });
});

// Use environment port (Render will set it automatically)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
