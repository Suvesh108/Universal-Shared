import { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';
import https from 'https';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let downloadedInstallerPath = null;

const port = process.env.PORT || '3847';
const dataDir = path.join(app.getPath('userData'), 'data');
try {
  fs.mkdirSync(dataDir, { recursive: true });
} catch (e) {}

process.env.DATA_DIR = dataDir;
process.env.PORT = port;

const frontendCandidates = [
  path.join(__dirname, '../frontend/dist'),
  path.join(process.resourcesPath, 'frontend/dist'),
  path.join(process.resourcesPath, 'app.asar/frontend/dist'),
];
for (const f of frontendCandidates) {
  if (fs.existsSync(path.join(f, 'index.html'))) {
    process.env.FRONTEND_DIST = f;
    break;
  }
}

// Start backend server
async function startBackend() {
  try {
    const candidates = [
      path.join(__dirname, '../backend/src/server.js'),
      path.join(process.resourcesPath, 'backend/src/server.js'),
      path.join(process.resourcesPath, 'app.asar/backend/src/server.js'),
    ];
    let backendServerFile = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        backendServerFile = c;
        break;
      }
    }
    if (!backendServerFile) {
      backendServerFile = path.join(__dirname, '../backend/src/server.js');
    }
    await import(pathToFileURL(backendServerFile).href);
    console.log('Backend server module loaded from', backendServerFile);
  } catch (err) {
    console.error('Failed to load backend server in electron:', err);
  }
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

function getIconPath() {
  const candidates = [
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(process.resourcesPath, 'build/icon.png'),
    path.join(process.resourcesPath, 'build/icon.ico'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function createWindow() {
  const icon = getIconPath();
  const preloadPath = path.join(__dirname, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1060,
    height: 760,
    minWidth: 500,
    minHeight: 620,
    backgroundColor: '#09090b',
    title: 'Universal Shared',
    icon: icon || undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appUrl = http://127.0.0.1:;

  mainWindow.loadURL(appUrl).catch(() => {
    setTimeout(() => {
      mainWindow?.loadURL(appUrl);
    }, 1500);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = getIconPath();
  if (!iconPath) return;

  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('Universal Shared');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Universal Shared',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Hide Window',
      click: () => {
        mainWindow?.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function downloadFileWithRedirects(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const get = url.startsWith('https:') ? https.get : http.get;

    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return downloadFileWithRedirects(res.headers.location, destPath, onProgress).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error(Download failed with HTTP ));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let receivedBytes = 0;

      res.on('data', (chunk) => {
        receivedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
          onProgress?.(percent);
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          onProgress?.(100);
          resolve(destPath);
        });
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

ipcMain.handle('download-update', async (_event, downloadUrl) => {
  const tempDir = app.getPath('temp');
  downloadedInstallerPath = path.join(tempDir, 'universal-shared-setup-update.exe');
  
  await downloadFileWithRedirects(downloadUrl, downloadedInstallerPath, (progress) => {
    mainWindow?.webContents.send('update-progress', progress);
  });

  return { ok: true, path: downloadedInstallerPath };
});

ipcMain.handle('apply-update', async () => {
  if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
    spawn(downloadedInstallerPath, [], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    
    isQuitting = true;
    app.quit();
    return { ok: true };
  }
  throw new Error('Installer file not found');
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await startBackend();
  await waitForServer(http://127.0.0.1:/api/info);
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});