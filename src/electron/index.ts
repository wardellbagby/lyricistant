import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { getCommonManager, registerCommonManagers } from 'common/Managers';
import { app, BrowserWindow, Menu } from 'electron';
import debug from 'electron-debug';
import { platform } from 'os';
import * as path from 'path';
import { QuitManager } from 'platform/QuitManager';
import { format as formatUrl } from 'url';
import { createAppMenu } from './app-menu';
import { createRendererDelegate } from './Delegates';

const isDevelopment: boolean = process.env.NODE_ENV !== 'production';

export let mainWindow: BrowserWindow;
let rendererDelegate: RendererDelegate;
let quitManager: QuitManager;

if (module.hot) {
  debug({
    showDevTools: false
  });
  module.hot.accept();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true
    }
  });
  rendererDelegate = createRendererDelegate(mainWindow);
  registerCommonManagers(rendererDelegate);
  quitManager = new QuitManager(rendererDelegate);
  quitManager.register();
  registerListeners();

  if (isDevelopment) {
    // tslint:disable-next-line: no-floating-promises
    mainWindow.loadURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    );
  } else {
    // tslint:disable-next-line: no-floating-promises
    mainWindow.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    );
  }

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });
  setMenu();
}

function registerListeners() {
  getCommonManager(FileManager).onNewFileOpened((recentFiles) => {
    setMenu(recentFiles);
  });
  rendererDelegate.on('ready-for-events', () => {
    rendererDelegate.send('ui-config', { showDownload: false });
  });
}

function setMenu(recentFiles?: string[]): void {
  const menuTemplate = createAppMenu(
    app.name,
    platform(),
    {
      onFindClicked: (): void => {
        rendererDelegate.send('find');
      },
      onNewClicked: newMenuItemHandler,
      onOpenClicked: async () => {
        await getCommonManager(FileManager).openFile();
      },
      onOpenRecentClicked: async (filePath) => {
        await getCommonManager(FileManager).openFile(filePath);
      },
      onPreferencesClicked: preferencesHandler,
      onQuitClicked: quitHandler,
      onRedoClicked: redoHandler,
      onReplaceClicked: (): void => {
        rendererDelegate.send('replace');
      },
      onSaveAsClicked: () => {
        getCommonManager(FileManager).saveFile(true);
      },
      onSaveClicked: () => {
        getCommonManager(FileManager).saveFile(false);
      },
      onUndoClicked: undoHandler
    },
    recentFiles
  );

  const mainMenu: Menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(mainMenu);
}

async function newMenuItemHandler() {
  await getCommonManager(FileManager).onNewFile();
}

function quitHandler(): void {
  quitManager.attemptQuit();
}

function undoHandler(): void {
  rendererDelegate.send('undo');
}

function redoHandler(): void {
  rendererDelegate.send('redo');
}

function preferencesHandler(): void {
  rendererDelegate.send('open-prefs');
}
