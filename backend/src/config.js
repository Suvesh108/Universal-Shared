import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export const PORT = Number(process.env.PORT) || 3847;
export const HOST = process.env.HOST || '0.0.0.0';
export const DATA_DIR = path.join(ROOT, 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const DB_PATH = path.join(DATA_DIR, 'clipboard.db');
export const MAX_HISTORY = 500;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const PAIRING_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const DEVICE_STALE_MS = 90 * 1000; // 90 seconds

export function getLocalAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  return addresses;
}

export function getPrimaryLocalUrl(port = PORT) {
  const addrs = getLocalAddresses();
  const preferred = addrs.find((a) => a.address.startsWith('192.168.'))
    || addrs.find((a) => a.address.startsWith('10.'))
    || addrs[0];
  const ip = preferred?.address || '127.0.0.1';
  return `http://${ip}:${port}`;
}
