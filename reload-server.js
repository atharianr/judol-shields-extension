const chokidar = require('chokidar');
const WebSocket = require('ws');

// WebSocket server
const wss = new WebSocket.Server({ port: 35729 });
console.log('🚀 WebSocket server running on ws://localhost:35729');

wss.on('connection', (ws) => {
    console.log('🔁 Client connected');
});

// Watch dist folder
chokidar.watch('./dist').on('change', (path) => {
    console.log(`🌀 File changed: ${path}`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('reload');
        }
    });
});
