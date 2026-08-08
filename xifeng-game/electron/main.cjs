const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow = null;
let apiServer = null;

async function startApiServer() {
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server.mjs')
    : path.join(app.getAppPath(), 'server.mjs');
  const { createApiServer } = await import(pathToFileURL(serverPath).href);
  apiServer = createApiServer();

  return new Promise((resolve, reject) => {
    apiServer.once('error', reject);
    apiServer.listen(0, '127.0.0.1', () => {
      const address = apiServer.address();
      if (!address || typeof address === 'string') {
        reject(new Error('本地 AI 服务未能取得端口。'));
        return;
      }
      resolve(address.port);
    });
  });
}

async function createWindow() {
  const apiPort = await startApiServer();
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1100,
    minHeight: 620,
    autoHideMenuBar: true,
    backgroundColor: '#17110c',
    icon: path.join(app.getAppPath(), 'dist', 'assets', 'seals', 'settings.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.maximize();
  await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), {
    query: { apiPort: String(apiPort) },
  });
}

app.whenReady().then(createWindow).catch((error) => {
  dialog.showErrorBox('熙宁抉择启动失败', error instanceof Error ? error.message : String(error));
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  apiServer?.close();
});
