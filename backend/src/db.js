import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { DB_PATH, DATA_DIR, MAX_HISTORY } from './config.js';

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_STORE_PATH = path.join(DATA_DIR, 'store.json');
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'universal-clipboard-secret-key-2026';

function getWasmPath() {
  const candidates = [
    path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'backend/node_modules/sql.js/dist/sql-wasm.wasm'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

let db = null;
let useJsonStore = false;
let initPromise = null;

// In-memory fallback data structures for serverless environments
const jsonStore = {
  devices: new Map(),
  pairing_codes: new Map(),
  clipboard_items: [],
};

// ----------------- Stateless Device Token Engine -----------------

export function createDeviceToken({ id, name, type, userAgent }) {
  const payload = {
    id,
    name: String(name || 'Device').slice(0, 64),
    type: type || 'unknown',
    ua: String(userAgent || '').slice(0, 128),
    ts: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function parseDeviceToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const raw = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    return {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      userAgent: raw.ua,
      pairedAt: raw.ts,
      lastSeen: Date.now(),
      token: token,
    };
  } catch (e) {
    return null;
  }
}

function loadJsonStore() {
  try {
    if (fs.existsSync(JSON_STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(JSON_STORE_PATH, 'utf8'));
      if (Array.isArray(raw.devices)) {
        for (const d of raw.devices) jsonStore.devices.set(d.id, d);
      }
      if (Array.isArray(raw.pairing_codes)) {
        for (const p of raw.pairing_codes) jsonStore.pairing_codes.set(p.code, p);
      }
      if (Array.isArray(raw.clipboard_items)) {
        jsonStore.clipboard_items = raw.clipboard_items;
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

function persistJsonStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = {
      devices: Array.from(jsonStore.devices.values()),
      pairing_codes: Array.from(jsonStore.pairing_codes.values()),
      clipboard_items: jsonStore.clipboard_items,
    };
    fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    // Ignore write errors in ephemeral environments
  }
}

function persistSql() {
  if (!db) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    // In-memory fallback
  }
}

function runMigrations() {
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'unknown',
      token TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      paired_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS pairing_codes (
      code TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      file_name TEXT,
      mime_type TEXT,
      size INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_clipboard_created ON clipboard_items(created_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen DESC)');
  persistSql();
}

export async function initDb() {
  if (db || useJsonStore) return db || jsonStore;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}

    try {
      const wasmPath = getWasmPath();
      if (!wasmPath) {
        throw new Error('sql-wasm.wasm not available, using JSON/memory store');
      }
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({ locateFile: () => wasmPath });
      if (fs.existsSync(DB_PATH)) {
        try {
          db = new SQL.Database(fs.readFileSync(DB_PATH));
        } catch (e) {
          db = new SQL.Database();
        }
      } else {
        db = new SQL.Database();
      }
      runMigrations();
      return db;
    } catch (err) {
      console.warn('[db] Running in fast JSON/Memory storage mode:', err.message);
      useJsonStore = true;
      loadJsonStore();
      return jsonStore;
    }
  })();

  return initPromise;
}

function queryAll(sql, params = []) {
  if (!db) return [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function execute(sql, params = []) {
  if (!db) return;
  db.run(sql, params);
  persistSql();
}

// ----------------- Devices -----------------

export function createDevice({ id, name, type, token, userAgent }) {
  const deviceId = id || uuidv4();
  const deviceToken = token || createDeviceToken({ id: deviceId, name, type, userAgent });
  const now = Date.now();
  const device = {
    id: deviceId,
    name: String(name || 'Device').slice(0, 64),
    type: type || 'unknown',
    token: deviceToken,
    userAgent: userAgent || null,
    pairedAt: now,
    lastSeen: now,
  };

  if (useJsonStore || !db) {
    jsonStore.devices.set(deviceId, device);
    persistJsonStore();
    return device;
  }

  try {
    execute(
      `INSERT OR REPLACE INTO devices (id, name, type, token, user_agent, paired_at, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, device.name, device.type, deviceToken, device.userAgent, now, now],
    );
  } catch (e) {}

  return getDeviceByToken(deviceToken) || device;
}

export function getDeviceByToken(token) {
  if (!token) return null;

  // 1. Check in-memory store
  if (useJsonStore || !db) {
    for (const d of jsonStore.devices.values()) {
      if (d.token === token) return d;
    }
  } else {
    const row = queryOne('SELECT * FROM devices WHERE token = ?', [token]);
    if (row) {
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        token: row.token,
        userAgent: row.user_agent,
        pairedAt: row.paired_at,
        lastSeen: row.last_seen,
      };
    }
  }

  // 2. Stateless / Serverless Token Decoding fallback (guarantees cross-lambda auth)
  const statelessDevice = parseDeviceToken(token);
  if (statelessDevice) {
    if (useJsonStore || !db) {
      jsonStore.devices.set(statelessDevice.id, statelessDevice);
      persistJsonStore();
    } else {
      try {
        execute(
          `INSERT OR REPLACE INTO devices (id, name, type, token, user_agent, paired_at, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [statelessDevice.id, statelessDevice.name, statelessDevice.type, statelessDevice.token, statelessDevice.userAgent, statelessDevice.pairedAt, statelessDevice.lastSeen],
        );
      } catch (e) {}
    }
    return statelessDevice;
  }

  return null;
}

export function getDeviceById(id) {
  if (useJsonStore || !db) {
    return jsonStore.devices.get(id) || null;
  }
  const row = queryOne('SELECT * FROM devices WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    token: row.token,
    userAgent: row.user_agent,
    pairedAt: row.paired_at,
    lastSeen: row.last_seen,
  };
}

export function touchDevice(id, name) {
  const now = Date.now();
  if (useJsonStore || !db) {
    const d = jsonStore.devices.get(id);
    if (d) {
      d.lastSeen = now;
      if (name) d.name = name;
      persistJsonStore();
    }
    return;
  }

  if (name) {
    execute('UPDATE devices SET last_seen = ?, name = ? WHERE id = ?', [now, name, id]);
  } else {
    execute('UPDATE devices SET last_seen = ? WHERE id = ?', [now, id]);
  }
}

export function listDevices() {
  if (useJsonStore || !db) {
    return Array.from(jsonStore.devices.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }
  return queryAll('SELECT * FROM devices ORDER BY last_seen DESC').map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    token: row.token,
    userAgent: row.user_agent,
    pairedAt: row.paired_at,
    lastSeen: row.last_seen,
  }));
}

export function deleteDevice(id) {
  if (useJsonStore || !db) {
    jsonStore.devices.delete(id);
    persistJsonStore();
    return;
  }
  execute('DELETE FROM devices WHERE id = ?', [id]);
}

export function updateDevice(id, { name, type }) {
  if (useJsonStore || !db) {
    const d = jsonStore.devices.get(id);
    if (d) {
      if (name) d.name = String(name).slice(0, 64);
      if (type) d.type = type;
      persistJsonStore();
    }
    return d || null;
  }
  execute('UPDATE devices SET name = ?, type = ? WHERE id = ?', [name, type, id]);
  persistSql();
  return getDeviceById(id);
}

// ----------------- Pairing Codes -----------------

export function createPairingCode(code, expiresAt) {
  const now = Date.now();
  if (useJsonStore || !db) {
    for (const [c, val] of jsonStore.pairing_codes.entries()) {
      if (val.expiresAt < now) jsonStore.pairing_codes.delete(c);
    }
    jsonStore.pairing_codes.set(code, { code, expiresAt, used: 0 });
    persistJsonStore();
    return;
  }
  execute('DELETE FROM pairing_codes WHERE expires_at < ?', [now]);
  execute('INSERT INTO pairing_codes (code, expires_at, used) VALUES (?, ?, 0)', [code, expiresAt]);
}

export function consumePairingCode(code) {
  const now = Date.now();
  if (useJsonStore || !db) {
    const p = jsonStore.pairing_codes.get(code);
    if (!p || p.used || p.expiresAt < now) return false;
    p.used = 1;
    persistJsonStore();
    return true;
  }

  execute('DELETE FROM pairing_codes WHERE expires_at < ?', [now]);
  const row = queryOne('SELECT * FROM pairing_codes WHERE code = ?', [code]);
  if (!row || row.used || row.expires_at < now) return false;
  execute('UPDATE pairing_codes SET used = 1 WHERE code = ?', [code]);
  return true;
}

// ----------------- Clipboard Items -----------------

export function addClipboardItem(item) {
  const newItem = {
    id: item.id || uuidv4(),
    deviceId: item.deviceId,
    deviceName: item.deviceName,
    type: item.type,
    content: item.content || null,
    filePath: item.filePath || null,
    fileName: item.fileName || null,
    mimeType: item.mimeType || null,
    size: item.size || 0,
    createdAt: item.createdAt || Date.now(),
  };

  if (useJsonStore || !db) {
    jsonStore.clipboard_items.unshift(newItem);
    if (jsonStore.clipboard_items.length > MAX_HISTORY) {
      jsonStore.clipboard_items = jsonStore.clipboard_items.slice(0, MAX_HISTORY);
    }
    persistJsonStore();
    return newItem;
  }

  execute(
    `INSERT INTO clipboard_items (id, device_id, device_name, type, content, file_path, file_name, mime_type, size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newItem.id,
      newItem.deviceId,
      newItem.deviceName,
      newItem.type,
      newItem.content,
      newItem.filePath,
      newItem.fileName,
      newItem.mimeType,
      newItem.size,
      newItem.createdAt,
    ],
  );

  const count = queryOne('SELECT COUNT(*) as count FROM clipboard_items')?.count || 0;
  if (count > MAX_HISTORY) {
    execute(
      `DELETE FROM clipboard_items WHERE id NOT IN (
        SELECT id FROM clipboard_items ORDER BY created_at DESC LIMIT ?
      )`,
      [MAX_HISTORY],
    );
  }

  return getClipboardItem(newItem.id);
}

export function getClipboardItem(id) {
  if (useJsonStore || !db) {
    return jsonStore.clipboard_items.find((i) => i.id === id) || null;
  }
  const row = queryOne('SELECT * FROM clipboard_items WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    deviceId: row.device_id,
    deviceName: row.device_name,
    type: row.type,
    content: row.content,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  };
}

export function listClipboardItems({ limit = 50, offset = 0 } = {}) {
  if (useJsonStore || !db) {
    const sorted = [...jsonStore.clipboard_items].sort((a, b) => b.createdAt - a.createdAt);
    const items = sorted.slice(offset, offset + limit);
    return { items, total: sorted.length };
  }
  const items = queryAll(
    'SELECT * FROM clipboard_items ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset],
  ).map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    deviceName: row.device_name,
    type: row.type,
    content: row.content,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  }));
  const total = queryOne('SELECT COUNT(*) as count FROM clipboard_items')?.count || 0;
  return { items, total };
}

export function deleteClipboardItem(id) {
  if (useJsonStore || !db) {
    jsonStore.clipboard_items = jsonStore.clipboard_items.filter((i) => i.id !== id);
    persistJsonStore();
    return;
  }
  execute('DELETE FROM clipboard_items WHERE id = ?', [id]);
}

export function clearClipboardHistory() {
  if (useJsonStore || !db) {
    jsonStore.clipboard_items = [];
    persistJsonStore();
    return;
  }
  execute('DELETE FROM clipboard_items');
}

export default { initDb };
