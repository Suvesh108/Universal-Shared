import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function getWifiOrLanIp() {
  const interfaces = os.networkInterfaces();
  let wifiIp = null;
  let backupIp = null;

  for (const name of Object.keys(interfaces)) {
    const nameLower = name.toLowerCase();
    const isWifi = nameLower.includes('wi-fi') || nameLower.includes('wifi') || nameLower.includes('wlan');
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (isWifi) {
          wifiIp = iface.address;
          break;
        } else if (!backupIp && !iface.address.startsWith('169.254.') && !iface.address.startsWith('172.')) {
          backupIp = iface.address;
        }
      }
    }
    if (wifiIp) break;
  }

  return wifiIp || backupIp || '127.0.0.1';
}

function updateEnvFile(ip) {
  const envPath = path.join(ROOT, '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const hostIpRegex = /^HOST_IP\s*=\s*(.*)$/m;
  const match = envContent.match(hostIpRegex);

  if (!match || match[1].trim() !== ip) {
    if (match) {
      envContent = envContent.replace(hostIpRegex, `HOST_IP=${ip}`);
    } else {
      envContent = (envContent.trim() + `\nHOST_IP=${ip}\n`).trim() + '\n';
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`\x1b[32m[setup] SUCCESS: HOST_IP updated to ${ip} in .env\x1b[0m`);
  } else {
    console.log(`\x1b[34m[setup] HOST_IP is already correctly set to ${ip} in .env\x1b[0m`);
  }
}

function checkAndConfigureSharing() {
  if (process.platform !== 'win32') {
    return;
  }

  console.log('[setup] Checking Windows Sharing & Firewall rules...');
  let needsSetup = false;

  // 1. Check if the firewall rule exists
  try {
    const fwOutput = execSync('netsh advfirewall firewall show rule name="Universal Clipboard"', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
    if (!fwOutput.includes('Universal Clipboard')) {
      needsSetup = true;
    }
  } catch (e) {
    needsSetup = true;
  }

  // 2. Check if the port proxy exists
  if (!needsSetup) {
    try {
      const proxyOutput = execSync('netsh interface portproxy show v4tov4', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const hasProxy = proxyOutput.includes('3847') && proxyOutput.includes('0.0.0.0') && proxyOutput.includes('127.0.0.1');
      if (!hasProxy) {
        needsSetup = true;
      }
    } catch (e) {
      needsSetup = true;
    }
  }

  if (needsSetup) {
    console.log('\x1b[33m[setup] Sharing configurations are missing. Launching configuration script...\x1b[0m');
    try {
      const batPath = path.join(ROOT, 'setup-sharing.bat');
      // Run the setup-sharing.bat which self-elevates. We run it in a separate process.
      spawn('cmd.exe', ['/c', batPath], {
        cwd: ROOT,
        detached: true,
        stdio: 'ignore'
      }).unref();
      console.log('\x1b[33m[setup] Prompted for Administrator privileges to setup sharing. Please approve if UAC prompt appears.\x1b[0m');
    } catch (err) {
      console.error('\x1b[31m[setup] Error running setup-sharing.bat:\x1b[0m', err.message);
    }
  } else {
    console.log('\x1b[32m[setup] Windows Sharing and Firewall configurations are already active.\x1b[0m');
  }
}

function main() {
  console.log('[setup] Starting startup checklist...');
  const ip = getWifiOrLanIp();
  updateEnvFile(ip);
  checkAndConfigureSharing();
  console.log('[setup] Startup checklist finished.\n');
}

main();
