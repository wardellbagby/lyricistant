import { platform } from 'os';
import * as path from 'path';
import { format as formatUrl, URL } from 'url';
import { createAppMenu } from '@electron-app/app-menu';
import { createAppComponent } from '@electron-app/AppComponent';
import { ElectronLogger } from '@electron-app/platform/ElectronLogger';
import { QuitManager } from '@electron-app/platform/QuitManager';
import { createRendererDelegate } from '@electron-delegates/Delegates';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { Files } from '@lyricistant/common-platform/files/Files';
import { Managers } from '@lyricistant/common-platform/Managers';
import { isDevelopment, isUnderTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { DIContainer } from '@wessberg/di';
import { app, BrowserWindow, dialog, Menu, MenuItem, shell } from 'electron';
import debug from 'electron-debug';

export let mainWindow: BrowserWindow;
let appComponent: DIContainer;
let rendererDelegate: RendererDelegate;
let logger: ElectronLogger;
let initialFilePath = app.isPackaged ? process.argv[1] : undefined;

process.on('uncaughtException', (err) => {
  crash(err);
});
process.on('unhandledRejection', (err) => {
  crash(err);
});

if (isDevelopment || isUnderTest) {
  debug({
    isEnabled: true,
    showDevTools: false,
  });
}

const crash = (reason: any) => {
  const availableLogger = logger ?? console;

  availableLogger?.error(
    'Error loading the webpage',
    reason,
    path.join(__dirname, 'index.html')
  );

  dialog.showErrorBox(
    'Crash',
    [
      'Sorry, Lyricistant has crashed! Please contact the developers.',
      '',
      `App version: ${process.env.APP_VERSION}`,
      `Homepage: ${process.env.APP_HOMEPAGE}`,
      `Log location: ${logger?.getLogFolder() ?? 'No logs available'}`,
    ].join('\n')
  );
  if (!isDevelopment) {
    mainWindow.destroy();
    app.quit();
  }
};

const newMenuItemHandler = async () => {
  appComponent.get<FileManager>().onNewFile();
};

const quitHandler = (): void => {
  appComponent.get<QuitManager>().attemptQuit();
};

const undoHandler = (): void => {
  rendererDelegate.send('undo');
};

const redoHandler = (): void => {
  rendererDelegate.send('redo');
};

const preferencesHandler = (): void => {
  rendererDelegate.send('open-prefs');
};

const setMenu = (recentFiles?: string[]): void => {
  const menuTemplate = createAppMenu(
    app.name,
    platform(),
    {
      onFindClicked: (): void => {
        rendererDelegate.send('find');
      },
      onNewClicked: newMenuItemHandler,
      onOpenClicked: async () => {
        await appComponent.get<FileManager>().onOpenFile();
      },
      onOpenRecentClicked: async (filePath) => {
        await appComponent
          .get<Files>()
          .readFile(filePath)
          .then(appComponent.get<FileManager>().onOpenFile);
      },
      onPreferencesClicked: preferencesHandler,
      onAboutClicked: () => rendererDelegate.send('open-about'),
      onQuitClicked: quitHandler,
      onRedoClicked: redoHandler,
      onReplaceClicked: (): void => {
        rendererDelegate.send('replace');
      },
      onSaveAsClicked: () => {
        appComponent.get<FileManager>().onSaveFile(true);
      },
      onSaveClicked: () => {
        appComponent.get<FileManager>().onSaveFile(false);
      },
      onUndoClicked: undoHandler,
    },
    recentFiles
  );

  const mainMenu: Menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(mainMenu);
};

const onAppComponentCreated = () => {
  const fileManager = appComponent.get<FileManager>();

  fileManager.addOnFileChangedListener(
    (_: undefined, recentFiles: string[]) => {
      setMenu(recentFiles);
    }
  );

  if (initialFilePath) {
    appComponent
      .get<Files>()
      .readFile(initialFilePath)
      .then(appComponent.get<FileManager>().onOpenFile)
      .catch((reason: any) =>
        logger.error('Failed to open initial file', initialFilePath, reason)
      );
  }
};

const setupSpellcheck = (window: BrowserWindow) => {
  window.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => window.webContents.replaceMisspelling(suggestion),
        })
      );
    }

    if (params.misspelledWord) {
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () =>
            window.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            ),
        })
      );
    }
    menu.popup();
  });
};
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    // Dimens of an iPhone SE, which is the smallest size Lyricistant looks comfortable on.
    minWidth: 375,
    minHeight: 667,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      nodeIntegration: isUnderTest,
      contextIsolation: false,
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false,
      disableBlinkFeatures: 'FileSystemAccess',
    },
  });
  appComponent = createAppComponent(mainWindow);
  logger = appComponent.get<Logger>() as ElectronLogger;
  rendererDelegate = createRendererDelegate(mainWindow);

  appComponent.get<Managers>().forEach((manager) => {
    logger.verbose(`Registering ${manager.constructor.name}`);
    manager.register();
  });

  onAppComponentCreated();

  logger.info('Platform information', {
    appPlatform: 'Electron',
    version: app.getVersion() ?? 'Error',
    os: platform() ?? 'Error',
    isDevelopment,
  });

  let rendererPage: string;

  if (process.env.RENDERER_SERVER_PORT) {
    rendererPage = `http://localhost:${process.env.RENDERER_SERVER_PORT}`;
  } else {
    rendererPage = formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    });
  }

  mainWindow.loadURL(rendererPage).catch(crash);

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
  mainWindow.on('close', (event) => {
    appComponent.get<QuitManager>().attemptQuit();
    event.preventDefault();
  });
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const newUrl = new URL(url);
    const rendererUrl = new URL(rendererPage);
    if (
      newUrl.host !== rendererUrl.host ||
      newUrl.protocol !== rendererUrl.protocol ||
      newUrl.origin !== rendererUrl.origin
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  setupSpellcheck(mainWindow);
  setMenu();
};

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (appComponent) {
    appComponent
      .get<Files>()
      .readFile(filePath)
      .then(appComponent.get<FileManager>().onOpenFile)
      .catch((reason: any) =>
        logger.error('Failed to open initial file', initialFilePath, reason)
      );
  } else {
    initialFilePath = filePath;
  }
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
