import { IpcChannels } from 'common/ipc-channels';
import { PreferencesData } from 'common/PreferencesData';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainEvent,
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

const isDevelopment: boolean = process.env.NODE_ENV !== 'production';
const recentFilesFilePath = `${app.getPath('userData')}/recent_files.json`;
const preferencesFilePath = `${app.getPath('userData')}/preferences.json`;

let mainWindow: BrowserWindow;
let currentFilePath: string;
let currentPreferences: PreferencesData;

if (module.hot) {
  debug();
  module.hot.accept();
}

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

nativeTheme.on('updated', () => {
  mainWindow.webContents.send(
    IpcChannels.THEME_CHANGED,
    currentPreferences?.textSize,
    nativeTheme.shouldUseDarkColors
  );
  mainWindow.blur();
  mainWindow.focus();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on(IpcChannels.READY_FOR_EVENTS, () => {
  mainWindow.webContents.send(
    IpcChannels.PREFERENCES_UPDATED,
    loadPreferences()
  );
  mainWindow.webContents.send(
    IpcChannels.THEME_CHANGED,
    currentPreferences.textSize,
    nativeTheme.shouldUseDarkColors
  );
  mainWindow.webContents.send(IpcChannels.NEW_FILE_CREATED);
});

ipcMain.on(IpcChannels.EDITOR_TEXT, (_: IpcMainEvent, text: string) => {
  writeFile(currentFilePath, text, (error: NodeJS.ErrnoException) => {
    mainWindow.webContents.send(
      IpcChannels.FILE_SAVE_ENDED,
      error,
      currentFilePath
    );
  });
});

ipcMain.on(IpcChannels.PROMPT_SAVE_FOR_NEW, () => {
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
        mainWindow.webContents.send(IpcChannels.NEW_FILE_CREATED);
      }
    })
    .catch(() => {
      dialog.showErrorBox(
        'Error',
        'Error trying to show the confirm quit dialog for creating a new file.'
      );
    });
});

ipcMain.on(IpcChannels.PROMPT_SAVE_FOR_QUIT, () => {
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

ipcMain.on(IpcChannels.OKAY_FOR_NEW_FILE, () => {
  currentFilePath = undefined;
  mainWindow.webContents.send(IpcChannels.NEW_FILE_CREATED);
});

ipcMain.on(IpcChannels.OKAY_FOR_QUIT, () => {
  app.quit();
});

ipcMain.on(IpcChannels.SAVE_PREFERENCES, (_: any, data: PreferencesData) => {
  if (!data) {
    mainWindow.webContents.send(IpcChannels.CLOSE_PREFERENCES);
    return;
  }

  savePreferences(data);
  mainWindow.webContents.send(IpcChannels.PREFERENCES_UPDATED, data);
  mainWindow.webContents.send(
    IpcChannels.THEME_CHANGED,
    data.textSize,
    nativeTheme.shouldUseDarkColors
  );
  mainWindow.webContents.send(IpcChannels.CLOSE_PREFERENCES);
});

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
            mainWindow.webContents.send(IpcChannels.FIND);
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            mainWindow.webContents.send(IpcChannels.REPLACE);
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
            mainWindow.webContents.send(IpcChannels.FIND);
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            mainWindow.webContents.send(IpcChannels.REPLACE);
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
  mainWindow.webContents.send(IpcChannels.ATTEMPT_NEW_FILE);
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
    mainWindow.webContents.send(IpcChannels.FILE_OPENED, error, filePath, data);
    addToRecentFiles(filePath);
  });
}

function saveMenuItemHandler(): void {
  if (!currentFilePath) {
    saveAsHandler();
  } else {
    mainWindow.webContents.send(IpcChannels.FILE_SAVE_STARTED, currentFilePath);
    mainWindow.webContents.send(IpcChannels.REQUEST_EDITOR_TEXT);
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
        mainWindow.webContents.send(IpcChannels.REQUEST_EDITOR_TEXT);
        addToRecentFiles(value.filePath);
      }
    })
    .catch(() => {
      dialog.showErrorBox('Error', 'Error trying to show the save as dialog.');
    });
}

function quitHandler(): void {
  mainWindow.webContents.send(IpcChannels.ATTEMPT_QUIT);
}

function undoHandler(): void {
  mainWindow.webContents.send(IpcChannels.UNDO);
}

function redoHandler(): void {
  mainWindow.webContents.send(IpcChannels.REDO);
}

function preferencesHandler(): void {
  mainWindow.webContents.send(IpcChannels.OPEN_PREFERENCES);
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
