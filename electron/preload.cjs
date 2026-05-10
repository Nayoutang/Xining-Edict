const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xiningApp', {
  quit: () => ipcRenderer.send('app:quit'),
});
