import { RendererDelegate } from '@common/Delegates';
import { FileManager } from '@common/files/FileManager';
import { Logger } from '@common/Logger';
import { Managers } from '@common/Managers';
import { app, BrowserWindow, dialog, Menu, shell } from 'electron';
import debug from 'electron-debug';
import { autoUpdater } from 'electron-updater';
import { platform } from 'os';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { createAppMenu } from './app-menu';
import { appComponent } from './AppComponent';
import { createRendererDelegate } from './Delegates';
import { QuitManager } from './platform/QuitManager';

const isUiTest = process.env.NODE_ENV === 'spectron-test';
const isDevelopment = process.env.NODE_ENV !== 'production';

export let mainWindow: BrowserWindow;
let rendererDelegate: RendererDelegate;
const logger = appComponent.get<Logger>();

if (isDevelopment) {
  debug({
    isEnabled: true,
    showDevTools: false,
  });
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
  if (!appComponent.has<Logger>()) {
    throw new Error('app component is empty');
  }
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: isUiTest,
      contextIsolation: false,
      enableRemoteModule: isUiTest,
      preload: path.resolve(__dirname, 'preload.js'),
    },
  });
  rendererDelegate = createRendererDelegate(mainWindow);
  appComponent.get<Managers>().forEach((manager) => manager.register());
  registerListeners();
  setupUpdater();

  logger.info('Platform information', {
    appPlatform: 'Electron',
    version: app.getVersion() ?? 'Error',
    os: platform() ?? 'Error',
    isDevelopment,
  });

  mainWindow
    .loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    )
    .catch(showLoadingError);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });
  mainWindow.on('close', (event) => {
    appComponent.get<QuitManager>().attemptQuit();
    event.preventDefault();
  });
  mainWindow.webContents.on('new-window', (event, urlString) => {
    const url = new URL(urlString);
    if (
      url.host === 'github.com' &&
      url.pathname.startsWith('/wardellbagby/lyricistant')
    ) {
      event.preventDefault();
      shell.openExternal(urlString);
    }
  });
  setMenu();
}

function registerListeners() {
  appComponent.get<FileManager>().addOnFileChangedListener((_, recentFiles) => {
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
        await appComponent.get<FileManager>().openFile();
      },
      onOpenRecentClicked: async (filePath) => {
        await appComponent.get<FileManager>().openFile(filePath);
      },
      onPreferencesClicked: preferencesHandler,
      onAboutClicked: () => rendererDelegate.send('open-about'),
      onQuitClicked: quitHandler,
      onRedoClicked: redoHandler,
      onReplaceClicked: (): void => {
        rendererDelegate.send('replace');
      },
      onSaveAsClicked: () => {
        appComponent.get<FileManager>().saveFile(true);
      },
      onSaveClicked: () => {
        appComponent.get<FileManager>().saveFile(false);
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
    path.join(__dirname, 'index.html')
  );
  mainWindow.destroy();
  dialog.showErrorBox(
    'Error',
    "Sorry, we couldn't load Lyricistant! Please contact the developers!"
  );
  app.quit();
}

async function newMenuItemHandler() {
  await appComponent.get<FileManager>().onNewFile();
}

function quitHandler(): void {
  appComponent.get<QuitManager>().attemptQuit();
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
