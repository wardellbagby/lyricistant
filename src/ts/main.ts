import { app, BrowserWindow } from 'electron';
let mainWindow: BrowserWindow;

function createWindow(): void {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });
  mainWindow.loadFile('src/html/index.html');
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => { app.quit(); });

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
