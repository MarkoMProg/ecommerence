import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const players = new Map();

io.on('connection', (socket) =>{
    console.log("Player connected:", socket.id);

    socket.on('join-game', (playerName) =>{
        const player = {
            id: socket.id,
            name: playerName,
            x: Math.random() * 800,
            y: Math.random() * 800,
            color: `hsl(${Math.random()* 360}, 70%, 50%)` 
        };

        players.set(socket.id, player);

        socket.emit('current-players', Array.from(players.values()));

        socket.broadcast.emit('player-joined',player);

    socket.on('disconnect', () =>{
        console.log("Player disconnected:", socket.id);
        players.delete(socket.id);
        socket.broadcast.emit('player-left', socket.id);
    })
});
});


const PORT = 3001;

server.listen(PORT, () =>{
    console.log(`Server is loading on port: ${PORT}`);
})

