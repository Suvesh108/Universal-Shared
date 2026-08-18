import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH, DATA_DIR, MAX_HISTORY } from './config.js';

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  return path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
}

let db = null;
let initPromise = null;

function persist() {
  if (!db) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    // In-memory fallback if persistence fails on serverless filesystem
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
  persist();
}

export async function initDb() {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}

    const wasmPath = getWasmPath();
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
  })();

  return initPromise;
}

function rowToDevice(row) {
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

function rowToItem(row) {
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

function queryAll(sql, params = []) {
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
  db.run(sql, params);
  persist();
}

export function createDevice({ id, name, type, token, userAgent }) {
  const now = Date.now();
  execute(
    `INSERT INTO devices (id, name, type, token, user_agent, paired_at, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, type, token, userAgent || null, now, now],
  );
  return getDeviceByToken(token);
}

export function getDeviceByToken(token) {
  return rowToDevice(queryOne('SELECT * FROM devices WHERE token = ?', [token]));
}

export function getDeviceById(id) {
  return rowToDevice(queryOne('SELECT * FROM devices WHERE id = ?', [id]));
}

export function touchDevice(id, name) {
  if (name) {
    execute('UPDATE devices SET last_seen = ?, name = ? WHERE id = ?', [Date.now(), name, id]);
  } else {
    execute('UPDATE devices SET last_seen = ? WHERE id = ?', [Date.now(), id]);
  }
}

export function listDevices() {
  return queryAll('SELECT * FROM devices ORDER BY last_seen DESC').map(rowToDevice);
}

export function deleteDevice(id) {
  execute('DELETE FROM devices WHERE id = ?', [id]);
}

export function createPairingCode(code, expiresAt) {
  execute('DELETE FROM pairing_codes WHERE expires_at < ?', [Date.now()]);
  execute('INSERT INTO pairing_codes (code, expires_at, used) VALUES (?, ?, 0)', [code, expiresAt]);
}

export function consumePairingCode(code) {
  execute('DELETE FROM pairing_codes WHERE expires_at < ?', [Date.now()]);
  const row = queryOne('SELECT * FROM pairing_codes WHERE code = ?', [code]);
  if (!row || row.used || row.expires_at < Date.now()) return false;
  execute('UPDATE pairing_codes SET used = 1 WHERE code = ?', [code]);
  return true;
}

export function addClipboardItem(item) {
  execute(
    `INSERT INTO clipboard_items (id, device_id, device_name, type, content, file_path, file_name, mime_type, size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.deviceId,
      item.deviceName,
      item.type,
      item.content,
      item.filePath,
      item.fileName,
      item.mimeType,
      item.size,
      item.createdAt,
    ],
  );

  const count = queryOne('SELECT COUNT(*) as count FROM clipboard_items').count;
  if (count > MAX_HISTORY) {
    execute(
      `DELETE FROM clipboard_items WHERE id NOT IN (
        SELECT id FROM clipboard_items ORDER BY created_at DESC LIMIT ?
      )`,
      [MAX_HISTORY],
    );
  }

  return getClipboardItem(item.id);
}

export function getClipboardItem(id) {
  return rowToItem(queryOne('SELECT * FROM clipboard_items WHERE id = ?', [id]));
}

export function listClipboardItems({ limit = 50, offset = 0 } = {}) {
  const items = queryAll(
    'SELECT * FROM clipboard_items ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset],
  ).map(rowToItem);
  const total = queryOne('SELECT COUNT(*) as count FROM clipboard_items').count;
  return { items, total };
}

export function deleteClipboardItem(id) {
  execute('DELETE FROM clipboard_items WHERE id = ?', [id]);
}

export function clearClipboardHistory() {
  execute('DELETE FROM clipboard_items');
}

export function updateDevice(id, { name, type }) {
  execute('UPDATE devices SET name = ?, type = ? WHERE id = ?', [name, type, id]);
  persist();
  return getDeviceById(id);
}

export default { initDb };
