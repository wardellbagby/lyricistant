import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { getCommonManager, registerCommonManagers } from 'common/Managers';
import { app, BrowserWindow, dialog, Menu } from 'electron';
import debug from 'electron-debug';
import { autoUpdater } from 'electron-updater';
import { platform } from 'os';
import * as path from 'path';
import { logger } from 'platform/Logger';
import { QuitManager } from 'platform/QuitManager';
import { format as formatUrl } from 'url';
import { createAppMenu } from './app-menu';
import { createRendererDelegate } from './Delegates';

const isDevelopment = process.env.NODE_ENV !== 'production';

export let mainWindow: BrowserWindow;
let rendererDelegate: RendererDelegate;
let quitManager: QuitManager;

if (isDevelopment) {
  debug({
    isEnabled: true,
    showDevTools: false,
  });
  if (module.hot) {
    module.hot.accept();
  }
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
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
    },
  });
  rendererDelegate = createRendererDelegate(mainWindow);
  registerCommonManagers(rendererDelegate);
  quitManager = new QuitManager(rendererDelegate);
  quitManager.register();
  registerListeners();
  setupUpdater();

  if (isDevelopment && process.env.ELECTRON_WEBPACK_WDS_PORT) {
    mainWindow
      .loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
      .catch(showLoadingError);
  } else {
    mainWindow
      .loadURL(
        formatUrl({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file',
          slashes: true,
        })
      )
      .catch(showLoadingError);
  }

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });
  mainWindow.on('close', (event) => {
    quitManager.attemptQuit();
    event.preventDefault();
  });
  setMenu();
}

function registerListeners() {
  getCommonManager(FileManager).addOnFileChangedListener((_, recentFiles) => {
    setMenu(recentFiles);
  });
}

function setupUpdater() {
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // noinspection JSIgnoredPromiseFromCall
  autoUpdater.checkForUpdatesAndNotify();
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
      onUndoClicked: undoHandler,
    },
    recentFiles
  );

  const mainMenu: Menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(mainMenu);
}

function showLoadingError(reason: any) {
  logger.error(
    'Error loading the webpage',
    reason,
    process.env.ELECTRON_WEBPACK_WDS_PORT
  );
  mainWindow.close();
  dialog.showErrorBox(
    'Error',
    "Sorry, we couldn't load Lyricistant! Please contact the developers!"
  );
  app.quit();
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
