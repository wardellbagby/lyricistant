import { RendererDelegate } from 'common/Delegates';
import { PreferencesData } from 'common/preferences/PreferencesData';
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  MenuItemConstructorOptions,
  MessageBoxReturnValue,
  nativeTheme,
  OpenDialogReturnValue,
  SaveDialogReturnValue
} from 'electron';
import debug from 'electron-debug';
import { existsSync, readFile, readFileSync, writeFile } from 'fs';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { createRendererDelegate } from './Delegates';

const isDevelopment: boolean = process.env.NODE_ENV !== 'production';
const recentFilesFilePath = `${app.getPath('userData')}/recent_files.json`;
const preferencesFilePath = `${app.getPath('userData')}/preferences.json`;

let mainWindow: BrowserWindow;
let rendererDelegate: RendererDelegate;

let currentFilePath: string;
let currentPreferences: PreferencesData;

if (module.hot) {
  debug();
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
  nativeTheme.on('updated', () => {
    rendererDelegate.send(
      'dark-mode-toggled',
      currentPreferences?.textSize,
      nativeTheme.shouldUseDarkColors
    );
    mainWindow.blur();
    mainWindow.focus();
  });

  rendererDelegate.on('ready-for-events', () => {
    rendererDelegate.send('prefs-updated', loadPreferences());
    rendererDelegate.send(
      'dark-mode-toggled',
      currentPreferences.textSize,
      nativeTheme.shouldUseDarkColors
    );
    rendererDelegate.send('new-file-created');
  });

  rendererDelegate.on('editor-text', (text: string) => {
    writeFile(currentFilePath, text, (error: NodeJS.ErrnoException) => {
      rendererDelegate.send('file-save-ended', error, currentFilePath);
    });
  });

  rendererDelegate.on('prompt-save-file-for-new', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        title: 'Confirm Quit',
        message:
          "Your changes haven't been saved. Are you sure you want to create a new file?",
        buttons: ['Create New File', 'Cancel'],
        cancelId: 1
      })
      .then((value: MessageBoxReturnValue) => {
        if (value.response === 0) {
          rendererDelegate.send('new-file-created');
        }
      })
      .catch(() => {
        dialog.showErrorBox(
          'Error',
          'Error trying to show the confirm quit dialog for creating a new file.'
        );
      });
  });

  rendererDelegate.on('prompt-save-file-for-quit', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        title: 'Confirm Quit',
        message:
          "Your changes haven't been saved. Are you sure you want to quit?",
        buttons: ['Quit', 'Cancel'],
        cancelId: 1
      })
      .then((value: MessageBoxReturnValue) => {
        if (value.response === 0) {
          app.quit();
        }
      })
      .catch(() => {
        dialog.showErrorBox(
          'Error',
          'Error trying to show the confirm quit dialog for quiting the app.'
        );
      });
  });

  rendererDelegate.on('okay-for-new-file', () => {
    currentFilePath = undefined;
    rendererDelegate.send('new-file-created');
  });

  rendererDelegate.on('okay-for-quit', () => {
    app.quit();
  });

  rendererDelegate.on('save-prefs', (data: PreferencesData) => {
    if (!data) {
      rendererDelegate.send('close-prefs');
      return;
    }

    savePreferences(data);
    rendererDelegate.send('prefs-updated', data);
    rendererDelegate.send(
      'dark-mode-toggled',
      data.textSize,
      nativeTheme.shouldUseDarkColors
    );
    rendererDelegate.send('close-prefs');
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
          click: openMenuItemHandler,
          accelerator: 'CmdOrCtrl+O'
        },
        {
          label: 'Open Recent',
          submenu: createRecentFilesSubmenu(recentFiles)
        },
        { type: 'separator' },
        {
          label: 'Save',
          click: saveMenuItemHandler,
          accelerator: 'CmdOrCtrl+S'
        },
        {
          label: 'Save As...',
          click: saveAsHandler,
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

function newMenuItemHandler(): void {
  rendererDelegate.send('new-file');
}

function openMenuItemHandler(): void {
  dialog
    .showOpenDialog(mainWindow, { properties: ['openFile'] })
    .then((value: OpenDialogReturnValue) => {
      if (value.filePaths.length > 0) {
        const filePath: string = value.filePaths[0];
        openFile(filePath);
      }
    })
    .catch(() => {
      dialog.showErrorBox(
        'Error',
        'Error trying to show the open file dialog.'
      );
    });
}

function openFile(filePath: string): void {
  readFile(filePath, 'utf8', (error: Error, data: string) => {
    currentFilePath = filePath;
    rendererDelegate.send('file-opened', error, filePath, data);
    addToRecentFiles(filePath);
  });
}

function saveMenuItemHandler(): void {
  if (!currentFilePath) {
    saveAsHandler();
  } else {
    rendererDelegate.send('file-save-started', currentFilePath);
    rendererDelegate.send('request-editor-text');
  }
}

function saveAsHandler(): void {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    })
    .then((value: SaveDialogReturnValue) => {
      if (value.filePath) {
        currentFilePath = value.filePath;
        rendererDelegate.send('request-editor-text');
        addToRecentFiles(value.filePath);
      }
    })
    .catch(() => {
      dialog.showErrorBox('Error', 'Error trying to show the save as dialog.');
    });
}

function quitHandler(): void {
  rendererDelegate.send('attempt-quit');
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
  loadedRecentFiles?: string[]
): MenuItemConstructorOptions[] {
  let validRecentFiles: string[];
  if (!loadedRecentFiles) {
    // flag is a+ even though we're only reading so that the file is created if it doesn't exist.
    const recentFilesFileContents: string = readFileSync(recentFilesFilePath, {
      encoding: 'utf8',
      flag: 'a+'
    });
    if (recentFilesFileContents.length === 0) {
      validRecentFiles = [];
    } else {
      validRecentFiles = JSON.parse(recentFilesFileContents) as string[];
    }
  } else {
    validRecentFiles = loadedRecentFiles;
  }

  return validRecentFiles.map((filePath: string) => {
    return {
      label: filePath,
      click: (): void => {
        openFile(filePath);
      }
    };
  });
}

function addToRecentFiles(filePath: string): void {
  readFile(recentFilesFilePath, 'utf8', (err: Error, data: string) => {
    let recentFiles: string[];
    if (data.length === 0) {
      recentFiles = [];
    } else {
      recentFiles = JSON.parse(data) as string[];
    }

    recentFiles.unshift(filePath);
    if (recentFiles.length > 10) {
      recentFiles.pop();
    }
    // Want this to be unique, but need this to be a list 'cause can't stringify a Set.
    recentFiles = [...new Set(recentFiles)];

    writeFile(recentFilesFilePath, JSON.stringify(recentFiles), () => {
      setMenu(recentFiles);
    });
  });
}

function loadPreferences(): PreferencesData | undefined {
  if (existsSync(preferencesFilePath)) {
    currentPreferences = JSON.parse(readFileSync(preferencesFilePath, 'utf8'));
  } else {
    currentPreferences = { textSize: 16 };
  }
  return currentPreferences;
}

function savePreferences(data: PreferencesData) {
  currentPreferences = data;
  writeFile(preferencesFilePath, JSON.stringify(data), () => undefined);
}
