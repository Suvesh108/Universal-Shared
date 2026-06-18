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
} else {
  app.get('*', (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Universal Clipboard - Troubleshooting</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              background: #09090b; 
              color: #f4f4f5; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              padding: 1.5rem;
              box-sizing: border-box;
            }
            .card { 
              background: rgba(24, 24, 27, 0.75); 
              backdrop-filter: blur(20px);
              border: 1px solid #27272a; 
              padding: 2.25rem 2rem; 
              border-radius: 16px; 
              max-width: 480px; 
              width: 100%;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); 
              text-align: center;
            }
            h1 { 
              color: #a78bfa; 
              margin-top: 0; 
              font-size: 1.4rem; 
              font-weight: 600;
              letter-spacing: -0.01em;
            }
            p { 
              color: #a1a1aa; 
              font-size: 0.9rem; 
              line-height: 1.5; 
              margin: 1rem 0;
            }
            ul {
              text-align: left;
              padding-left: 1.25rem;
              color: #a1a1aa;
              font-size: 0.85rem;
              line-height: 1.6;
            }
            code { 
              background: #27272a; 
              padding: 0.2rem 0.45rem; 
              border-radius: 4px; 
              font-family: ui-monospace, monospace; 
              color: #e4e4e7;
              font-size: 0.85rem;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Universal Clipboard</h1>
            <p>The server connected successfully, but the web interface assets are missing from the <code>frontend/dist</code> directory.</p>
            <p><strong>Common Fixes:</strong></p>
            <ul>
              <li>If running locally on your laptop, build the frontend first by running: <br><code>npm run build</code></li>
              <li>If using Docker, ensure you don't have a stale local Node.js process running on port <code>3847</code> of your host machine. That stale server will answer your phone with a 404, block the Docker container, and prevent it from serving the correct UI.</li>
            </ul>
          </div>
        </body>
      </html>
    `);
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
