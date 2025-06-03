const socket = io(window.location.origin);

const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
});

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('playerRole', (role) => {
    playerRole = role;
    console.log('Player role:', playerRole);
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    console.log('Move received:', move);
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    console.log('Board state received:', fen);
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = 'spectator';
    console.log('Spectator role assigned');
    renderBoard();
});

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square.type, square.color);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData('text/plain', '');
                    }
                });

                pieceElement.addEventListener('dragend', () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole==='b'){
        boardElement.classList.add('flipped');
    }
    else{
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {
    const sourceSquare = getSquareNotation(source);
    const targetSquare = getSquareNotation(target);
    const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
    });

    if (move) {
        socket.emit('move', move);
        renderBoard();
    } else {
        console.log('Invalid move');
    }
};

const getSquareNotation = (square) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return files[square.col] + (8 - square.row);
};

const getPieceUnicode = (type, color) => {
    const pieces = {
        p: { w: '♙', b: '♟' },
        r: { w: '♖', b: '♜' },
        n: { w: '♘', b: '♞' },
        b: { w: '♗', b: '♝' },
        q: { w: '♕', b: '♛' },
        k: { w: '♔', b: '♚' }
    };
    return pieces[type][color];
};

renderBoard();
