import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import {
  UPLOADS_DIR,
  DATA_DIR,
  MAX_FILE_SIZE,
  PAIRING_CODE_TTL_MS,
  DEVICE_STALE_MS,
  getLocalAddresses,
  getPrimaryLocalUrl,
  PORT,
} from '../config.js';
import {
  addClipboardItem,
  clearClipboardHistory,
  consumePairingCode,
  createDevice,
  createPairingCode,
  deleteClipboardItem,
  deleteDevice,
  getClipboardItem,
  getDeviceByToken,
  listClipboardItems,
  listDevices,
  updateDevice,
} from '../db.js';
import { detectType, serializeItem } from '../clipboard.js';

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (e) {}
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

function authDevice(req, res, next) {
  const token = req.headers['x-device-token'] || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Device token required' });
  }
  const device = getDeviceByToken(token);
  if (!device) {
    return res.status(401).json({ error: 'Invalid device token' });
  }
  req.device = device;
  next();
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createApiRouter(io = null, connectedSockets = null, server = null) {
  const router = Router();
  const socketEmitter = io || { emit: () => {} };
  const onlineMap = connectedSockets || new Map();

  const currentPort = () => server?.address?.()?.port || PORT;

  const getBaseUrl = (req) => {
    // 1. Client origin passed from frontend
    if (req.query?.origin && (req.query.origin.startsWith('http://') || req.query.origin.startsWith('https://'))) {
      return req.query.origin;
    }

    // 2. Explicit environment variable overrides
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
    if (process.env.HOST_IP) return `http://${process.env.HOST_IP}:${currentPort()}`;

    // 3. Vercel / Proxy forwarded headers
    const forwardedHost = req.headers['x-forwarded-host'];
    const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }

    // 4. VERCEL_URL fallback
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

    const hostHeader = req.get('host') || '';
    const hostOnly = hostHeader.split(':')[0];

    // 5. Fall back to primary LAN IP if host is loopback or Docker bridge
    const isLoopback = hostOnly === 'localhost' || hostOnly === '127.0.0.1' || hostOnly === '[::1]';
    const isDockerInternal = /^172\.(1[6-9]|2\d|3[01])\./.test(hostOnly) || hostOnly.startsWith('10.');

    if (isLoopback || isDockerInternal) {
      return getPrimaryLocalUrl(currentPort());
    }

    return `${req.protocol}://${hostHeader}`;
  };

  router.get('/info', (_req, res) => {
    const actualPort = currentPort();
    let hostIpOverride = null;
    try {
      const settingsPath = path.join(DATA_DIR, 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        hostIpOverride = settings.hostIp || null;
      }
    } catch (e) {
      // Ignore
    }

    res.json({
      name: 'Universal Clipboard',
      version: '1.0.0',
      port: actualPort,
      primaryUrl: getPrimaryLocalUrl(actualPort),
      addresses: getLocalAddresses(),
      onlineDevices: onlineMap.size,
      hostIpOverride,
    });
  });

  router.post('/settings', (req, res) => {
    const { hostIp } = req.body || {};
    try {
      const settingsPath = path.join(DATA_DIR, 'settings.json');
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      settings.hostIp = hostIp ? String(hostIp).trim() : null;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      res.json({ ok: true, settings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/pair/qr', async (req, res) => {
    try {
      const code = randomCode();
      createPairingCode(code, Date.now() + PAIRING_CODE_TTL_MS);
      const base = getBaseUrl(req);
      const pairUrl = `${base}?pair=${code}`;
      const qr = await QRCode.toDataURL(pairUrl, {
        margin: 2,
        width: 280,
        color: { dark: '#111827', light: '#ffffff' },
      });
      res.json({ code, pairUrl, qr, expiresIn: PAIRING_CODE_TTL_MS / 1000 });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pair/verify', (req, res) => {
    const { code, name, type, userAgent } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }
    if (!consumePairingCode(String(code).toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or expired pairing code' });
    }

    const device = createDevice({
      name: String(name).slice(0, 64),
      type: type || 'unknown',
      userAgent: userAgent || req.headers['user-agent'],
    });

    res.json({ device: { id: device.id, name: device.name, type: device.type, token: device.token } });
  });

  router.post('/devices/register', (req, res) => {
    const { name, type, userAgent } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const device = createDevice({
      name: String(name).slice(0, 64),
      type: type || 'unknown',
      userAgent: userAgent || req.headers['user-agent'],
    });

    res.json({ device: { id: device.id, name: device.name, type: device.type, token: device.token } });
  });

  router.get('/devices', authDevice, (_req, res) => {
    const now = Date.now();
    const devices = listDevices().map((d) => ({
      ...d,
      token: undefined,
      online: onlineMap.has(d.id),
      stale: now - d.lastSeen > DEVICE_STALE_MS,
    }));
    res.json({ devices });
  });

  router.post('/devices/me', authDevice, (req, res) => {
    const { name, type } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const updated = updateDevice(req.device.id, {
      name: String(name).slice(0, 64),
      type: type || req.device.type,
    });
    res.json({ device: { id: updated.id, name: updated.name, type: updated.type, token: updated.token } });
  });

  router.delete('/devices/:id', authDevice, (req, res) => {
    deleteDevice(req.params.id);
    res.json({ ok: true });
  });

  router.get('/history', authDevice, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const baseUrl = getBaseUrl(req);
    const { items, total } = listClipboardItems({ limit, offset });
    res.json({
      items: items.map((item) => serializeItem(item, baseUrl)),
      total,
      limit,
      offset,
    });
  });

  router.post('/clipboard', authDevice, (req, res) => {
    const { content, type } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const itemType = type || detectType({ content });
    const item = addClipboardItem({
      id: uuidv4(),
      deviceId: req.device.id,
      deviceName: req.device.name,
      type: itemType,
      content,
      filePath: null,
      fileName: null,
      mimeType: null,
      size: Buffer.byteLength(content, 'utf8'),
      createdAt: Date.now(),
    });

    const baseUrl = getBaseUrl(req);
    const payload = serializeItem(item, baseUrl);
    socketEmitter.emit('clipboard:new', payload);
    res.json({ item: payload });
  });

  router.post('/upload', authDevice, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const type = detectType({
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
    });

    let fileBase64 = null;
    try {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fileBase64 = fs.readFileSync(req.file.path).toString('base64');
      } else if (req.file.buffer) {
        fileBase64 = req.file.buffer.toString('base64');
      }
    } catch (e) {
      console.warn('Could not read upload buffer:', e.message);
    }

    const item = addClipboardItem({
      id: uuidv4(),
      deviceId: req.device.id,
      deviceName: req.device.name,
      type,
      content: fileBase64,
      filePath: req.file.filename,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdAt: Date.now(),
    });

    const baseUrl = getBaseUrl(req);
    const payload = serializeItem(item, baseUrl);
    socketEmitter.emit('clipboard:new', payload);
    res.json({ item: payload });
  });

  router.get('/files/:id', (req, res) => {
    const item = getClipboardItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = item.mimeType || 'application/octet-stream';
    const fileName = item.fileName || 'download';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    // 1. If file exists on current container disk, stream it directly
    if (item.filePath) {
      const filePath = path.join(UPLOADS_DIR, item.filePath);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // 2. If file missing from current container disk, serve from base64 content
    if (item.content) {
      try {
        const buffer = Buffer.from(item.content, 'base64');
        if (item.filePath) {
          try {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            fs.writeFileSync(path.join(UPLOADS_DIR, item.filePath), buffer);
          } catch (e) {}
        }
        return res.end(buffer);
      } catch (e) {
        console.error('Error serving file buffer:', e.message);
      }
    }

    return res.status(404).json({ error: 'File missing on disk' });
  });

  router.delete('/history/:id', authDevice, (req, res) => {
    const item = getClipboardItem(req.params.id);
    if (item?.filePath) {
      const filePath = path.join(UPLOADS_DIR, item.filePath);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
    }
    deleteClipboardItem(req.params.id);
    socketEmitter.emit('clipboard:deleted', { id: req.params.id });
    res.json({ ok: true });
  });

  router.delete('/history', authDevice, (_req, res) => {
    clearClipboardHistory();
    socketEmitter.emit('clipboard:cleared');
    res.json({ ok: true });
  });

  return router;
}
