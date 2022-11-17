import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients: Array<WebSocket> = [];

wss.on('connection', (socket: WebSocket) => {
    clients.push(socket);
    socket.on('message', (data: WebSocket.RawData) => {
        for (const sock of clients.filter(e => e !== socket))
            sock.send(data.toString());
    });
    socket.on('close', () => clients.splice(clients.indexOf(socket), 1));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`listening on port ${PORT}...`));
