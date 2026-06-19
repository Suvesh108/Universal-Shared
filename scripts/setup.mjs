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

function isAdmin() {
  try {
    execSync('net session', { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch (e) {
    return false;
  }
}

function getActivePortProxies() {
  const listenAddresses = [];
  try {
    const out = execSync('netsh interface portproxy show v4tov4', {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString();
    
    const lines = out.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && parts[1] === '3847') {
        listenAddresses.push(parts[0]);
      }
    }
  } catch (e) {}
  return listenAddresses;
}

function hasFirewallRule() {
  try {
    const out = execSync('netsh advfirewall firewall show rule name="Universal Clipboard"', {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString();
    return out.includes('Universal Clipboard') && out.includes('3847') && out.includes('5173');
  } catch (e) {
    return false;
  }
}

function getListeningPidsOnPort(port) {
  const pids = new Set();
  try {
    const out = execSync(`netstat -ano | findstr ":${port} "`, {
      stdio: ['pipe', 'pipe', 'ignore'],
      shell: true
    }).toString();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
  } catch (e) { /* port is free */ }
  return pids;
}

function configureSharingAndFirewall() {
  if (process.platform !== 'win32') return;

  console.log('[setup] Checking Windows Sharing & Firewall rules...');

  // Check what needs to be configured
  const activeProxies = getActivePortProxies();
  const needsProxyDelete = activeProxies.length > 0;
  const needsFirewall = !hasFirewallRule();

  if (!needsProxyDelete && !needsFirewall) {
    console.log('\x1b[32m[setup] Windows Sharing and Firewall configurations are already correct.\x1b[0m');
    return;
  }

  if (isAdmin()) {
    console.log('\x1b[33m[setup] Configuring sharing rules directly (running as admin)...\x1b[0m');
    if (needsProxyDelete) {
      for (const addr of activeProxies) {
        try {
          execSync(`netsh interface portproxy delete v4tov4 listenport=3847 listenaddress=${addr}`, { stdio: 'pipe' });
        } catch (e) {}
      }
      // Wait for release
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
    }
    if (needsFirewall) {
      try { execSync('netsh advfirewall firewall delete rule name="Universal Clipboard"', { stdio: 'pipe' }); } catch (e) {}
      try {
        execSync('netsh advfirewall firewall add rule name="Universal Clipboard" dir=in action=allow protocol=TCP localport=3847,5173 profile=any', { stdio: 'pipe' });
      } catch (e) {}
    }
    console.log('\x1b[32m[setup] Sharing and Firewall configuration updated.\x1b[0m');
  } else {
    console.log('\x1b[33m[setup] Windows Sharing/Firewall configuration needs updates:\x1b[0m');
    if (needsProxyDelete) {
      console.log(`  - Stale port proxies on port 3847 must be removed (found listenaddresses: ${activeProxies.join(', ')}).`);
    }
    if (needsFirewall) {
      console.log('  - Inbound Firewall rule allowing port 3847 and 5173 must be added.');
    }
    console.log('\x1b[33m[setup] Requesting Administrator privileges to apply these fixes. Please approve the UAC prompt...\x1b[0m');

    const commands = [];
    for (const addr of activeProxies) {
      commands.push(`netsh interface portproxy delete v4tov4 listenport=3847 listenaddress=${addr}`);
    }
    if (needsFirewall) {
      commands.push('netsh advfirewall firewall delete rule name=""Universal Clipboard""');
      commands.push('netsh advfirewall firewall add rule name=""Universal Clipboard"" dir=in action=allow protocol=TCP localport=3847,5173 profile=any');
    }

    if (commands.length > 0) {
      const commandString = commands.join(' && ');
      const psCmd = `Start-Process cmd.exe -ArgumentList '/c ${commandString}' -Verb RunAs -WindowStyle Hidden -Wait`;
      try {
        execSync(`powershell -Command "${psCmd}"`, { stdio: 'inherit' });
        // Allow time for changes to take effect
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
        
        // Re-check
        const remainingProxies = getActivePortProxies();
        if (remainingProxies.length === 0) {
          console.log('\x1b[32m[setup] SUCCESS: Port proxy configuration resolved.\x1b[0m');
        } else {
          console.log('\x1b[31m[setup] ⚠ Some port proxies could not be removed automatically.\x1b[0m');
        }
      } catch (err) {
        console.error('\x1b[31m[setup] Error executing elevated configuration:\x1b[0m', err.message);
      }
    }
  }
}

function freePort3847() {
  if (process.platform !== 'win32') return;

  console.log('[setup] Checking port 3847...');

  // Step 1: Stop the Docker container if it is holding port 3847
  try {
    const dockerPs = execSync('docker ps --filter "name=universal-clipboard" --format "{{.Names}}"', {
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();

    if (dockerPs.includes('universal-clipboard')) {
      console.log('\x1b[33m[setup] Stopping Docker container "universal-clipboard"...\x1b[0m');
      execSync('docker stop universal-clipboard', { stdio: ['pipe', 'pipe', 'ignore'] });
      console.log('\x1b[32m[setup] Docker container stopped.\x1b[0m');
    }
  } catch (e) { /* Docker not available */ }

  // Step 2: Configure Sharing and Firewall rules (elevates if needed to delete proxies / add firewall rules)
  configureSharingAndFirewall();

  // Step 3: Kill any stale Node.js processes on port 3847
  const pids = getListeningPidsOnPort(3847);
  for (const pid of pids) {
    try {
      const pName = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        stdio: ['pipe', 'pipe', 'ignore'],
        shell: true
      }).toString().toLowerCase();
      if (pName.includes('node')) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: ['pipe', 'pipe', 'ignore'], shell: true });
        console.log(`\x1b[33m[setup] Killed stale Node.js process (PID ${pid}) on port 3847.\x1b[0m`);
      }
    } catch (e) { /* ignore */ }
  }

  // Final check
  const remainingPids = getListeningPidsOnPort(3847);
  if (remainingPids.size === 0) {
    console.log('\x1b[32m[setup] Port 3847 is free and ready.\x1b[0m');
  } else {
    console.log('\x1b[33m[setup] Port 3847 is held by a system process — Node will fall back to a random port.\x1b[0m');
    console.log('\x1b[33m[setup] → To fix permanently, run as Administrator.\x1b[0m');
  }
}

function main() {
  console.log('[setup] Starting startup checklist...');
  const ip = getWifiOrLanIp();
  updateEnvFile(ip);
  freePort3847();
  console.log('[setup] Startup checklist finished.\n');
}

main();
