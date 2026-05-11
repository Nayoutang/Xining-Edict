const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 720,
    fullscreen: true,
    backgroundColor: '#f4ecd8',
    title: '熙宁抉择',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

ipcMain.on('app:quit', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

