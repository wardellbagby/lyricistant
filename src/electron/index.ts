import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { getCommonManager, registerCommonManagers } from 'common/Managers';
import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import debug from 'electron-debug';
import * as path from 'path';
import { QuitManager } from 'platform/QuitManager';
import { format as formatUrl } from 'url';
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
}

// tslint:disable-next-line:max-func-body-length
function setMenu(recentFiles?: string[]): void {
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          click: newMenuItemHandler,
          accelerator: 'CmdOrCtrl+N'
        },
        { type: 'separator' },
        {
          label: 'Open...',
          click: async () => {
            await getCommonManager(FileManager).openFile();
          },
          accelerator: 'CmdOrCtrl+O'
        },
        {
          label: 'Open Recent',
          submenu: createRecentFilesSubmenu(recentFiles)
        },
        { type: 'separator' },
        {
          label: 'Save',
          click: () => {
            getCommonManager(FileManager).saveFile(false);
          },
          accelerator: 'CmdOrCtrl+S'
        },
        {
          label: 'Save As...',
          click: () => {
            getCommonManager(FileManager).saveFile(true);
          },
          accelerator: 'Shift+CmdOrCtrl+S'
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          click: preferencesHandler
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          click: undoHandler,
          accelerator: 'CmdOrCtrl+Z'
        },
        {
          label: 'Redo',
          click: redoHandler,
          accelerator: 'Shift+CmdOrCtrl+Z'
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            rendererDelegate.send('find');
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            rendererDelegate.send('replace');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          click: undoHandler,
          accelerator: 'CmdOrCtrl+Z'
        },
        {
          label: 'Redo',
          click: redoHandler,
          accelerator: 'Shift+CmdOrCtrl+Z'
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            rendererDelegate.send('find');
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            rendererDelegate.send('replace');
          }
        },
        { type: 'separator' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }]
    }
  ];
  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          click: preferencesHandler
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quit',
          click: quitHandler,
          accelerator: 'Cmd+Q'
        }
      ]
    });
    const fileMenu = menuTemplate[1].submenu as MenuItemConstructorOptions[];
    const prefIndex = fileMenu.findIndex(
      (value) => value.click === preferencesHandler
    );
    fileMenu.splice(prefIndex, 1);
  } else {
    (menuTemplate[0].submenu as MenuItemConstructorOptions[]).push(
      { type: 'separator' },
      {
        label: 'Quit',
        click: quitHandler,
        accelerator: 'Alt+F4'
      }
    );
  }

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

function createRecentFilesSubmenu(
  recentFiles?: string[]
): MenuItemConstructorOptions[] {
  if (!recentFiles) {
    return [
      {
        label: '<No recent files>',
        enabled: false
      }
    ];
  }
  return recentFiles.map((filePath: string) => {
    return {
      label: filePath,
      click: async () => {
        await getCommonManager(FileManager).openFile(filePath);
      }
    };
  });
}
