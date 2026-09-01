import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load environment variables from .env file at the root level if present
try {
  const envPath = path.join(ROOT, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2]?.trim() || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        // Set environment variable if not already set by the outer environment
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (err) {
  // Ignore env read errors
}

export const PORT = Number(process.env.PORT) || 3847;
export const HOST = process.env.HOST || '0.0.0.0';
export const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
export const DATA_DIR = process.env.DATA_DIR || (IS_SERVERLESS ? path.join(os.tmpdir(), 'universal-clipboard-data') : path.join(ROOT, 'data'));
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');
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
        let type = 'other';
        const lowerName = name.toLowerCase();
        const addr = iface.address;

        if (/wi-?fi|wlan|wireless|airport/i.test(lowerName)) {
          type = 'wifi';
        } else if (/bluetooth/i.test(lowerName)) {
          type = 'bluetooth';
        } else if (/hotspot/i.test(lowerName) || addr.startsWith('192.168.137.') || addr.startsWith('192.168.43.')) {
          type = 'hotspot';
        } else if (/ethernet|lan/i.test(lowerName) && !/vethernet|virtual|docker|wsl/i.test(lowerName)) {
          type = 'ethernet';
        } else if (/vethernet|virtual|docker|wsl|vbox/i.test(lowerName)) {
          type = 'virtual';
        }

        addresses.push({
          name,
          address: iface.address,
          type,
          label: `${name} (${iface.address})`
        });
      }
    }
  }

  // Sort: Wi-Fi first, then Ethernet, Hotspot, other 192.168/10, then Virtual last
  addresses.sort((a, b) => {
    const score = (item) => {
      if (item.type === 'wifi') return 10;
      if (item.type === 'hotspot') return 8;
      if (item.type === 'ethernet') return 7;
      if (item.address.startsWith('192.168.') && item.type !== 'virtual') return 6;
      if (item.address.startsWith('10.') && item.type !== 'virtual') return 5;
      if (item.type === 'other') return 3;
      if (item.type === 'bluetooth') return 2;
      return 1; // Virtual / fallback
    };
    return score(b) - score(a);
  });

  return addresses;
}

export function getPrimaryLocalUrl(port = PORT, preferredIp = null) {
  if (preferredIp && preferredIp !== '127.0.0.1') {
    return `http://${preferredIp}:${port}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }

  if (process.env.HOST_IP) {
    return `http://${process.env.HOST_IP}:${port}`;
  }
  
  // Try reading persistent settings file for hostIp override
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.hostIp) {
        return `http://${settings.hostIp}:${port}`;
      }
    }
  } catch (err) {
    // Ignore settings read errors
  }

  const addrs = getLocalAddresses();
  const ip = addrs[0]?.address || '127.0.0.1';
  return `http://${ip}:${port}`;
}
