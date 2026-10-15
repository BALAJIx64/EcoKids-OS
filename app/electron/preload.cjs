const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ecokidsDesktop', {
  isElectron: true,
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
  closeApp: () => ipcRenderer.send('app:close'),
  toggleFullscreen: () => ipcRenderer.send('app:toggle-fullscreen')
});
