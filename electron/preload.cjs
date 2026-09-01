const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  downloadUpdate: (url) => ipcRenderer.invoke('download-update', url),
  applyUpdate: () => ipcRenderer.invoke('apply-update'),
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (_event, progress) => callback(progress));
  }
});
