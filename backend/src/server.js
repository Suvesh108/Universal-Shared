import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { HOST, PORT, getLocalAddresses, getPrimaryLocalUrl } from './config.js';
import { initDb } from './db.js';
import { createApiRouter } from './routes/api.js';
import { setupSocket } from './socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '../../frontend/dist');
const hasFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));

await initDb();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 10e6,
});

const connectedSockets = setupSocket(io);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', createApiRouter(io, connectedSockets, server));

if (hasFrontend) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

function onListen() {
  const actualPort = server.address().port;
  const primary = getPrimaryLocalUrl(actualPort);
  const addresses = getLocalAddresses();

  console.log('');
  console.log('  Universal Clipboard — local server running');
  console.log('  -----------------------------------------');
  console.log(`  Primary URL:  ${primary}`);
  if (addresses.length > 1) {
    console.log('  All LAN IPs:');
    for (const { name, address } of addresses) {
      console.log(`    http://${address}:${actualPort}  (${name})`);
    }
  }
  console.log('');
  console.log('  Open the URL on your phone (same Wi-Fi) to pair via QR code.');
  console.log('  All data stays on this machine — no cloud, no internet required.');
  console.log('');
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is busy, retrying on a random available port...`);
    server.listen(0, HOST, onListen);
    return;
  }

  console.error('Failed to start server:', error);
  process.exitCode = 1;
});

server.listen(PORT, HOST, onListen);
