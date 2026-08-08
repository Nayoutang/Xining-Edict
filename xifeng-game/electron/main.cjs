const { app, BrowserWindow, dialog, nativeImage } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow = null;
let apiServer = null;

app.setName('熙宁抉择');
if (process.platform === 'win32') app.setAppUserModelId('cn.xining.juezhe');

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
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app-icon.png')
    : path.join(app.getAppPath(), 'build', 'icon.png');
  const windowIcon = nativeImage.createFromPath(iconPath);
  mainWindow = new BrowserWindow({
    title: '熙宁抉择',
    width: 1600,
    height: 900,
    minWidth: 1100,
    minHeight: 620,
    autoHideMenuBar: true,
    backgroundColor: '#17110c',
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow?.setTitle('熙宁抉择');
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
