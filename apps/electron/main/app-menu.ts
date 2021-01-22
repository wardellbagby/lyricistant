import { setTimeout } from 'timers';
import { MenuItemConstructorOptions } from 'electron';
import Platform = NodeJS.Platform;
import Timeout = NodeJS.Timeout;

export interface MenuItemHandlers {
  onNewClicked: () => void;
  onOpenClicked: () => void;
  onOpenRecentClicked: (filePath: string) => void;
  onSaveClicked: () => void;
  onSaveAsClicked: () => void;
  onPreferencesClicked: () => void;
  onAboutClicked: () => void;
  onUndoClicked: () => void;
  onRedoClicked: () => void;
  onFindClicked: () => void;
  onReplaceClicked: () => void;
  onQuitClicked: () => void;
}

export const createAppMenu = (
  appName: string,
  platform: Platform,
  handlers: MenuItemHandlers,
  recentFiles?: string[]
): MenuItemConstructorOptions[] => {
  (Object.keys({ ...handlers }) as Array<keyof MenuItemHandlers>)
    .filter((name) => name.startsWith('on'))
    .forEach((funcName) => {
      handlers[funcName] = debounce(handlers[funcName]);
    });
  const isMac = platform === 'darwin';
  const menuTemplate: MenuItemConstructorOptions[] = [
    createFileMenu(handlers, !isMac, !isMac, !isMac, recentFiles),
    createEditMenu(handlers),
    {
      role: 'window',
      submenu: [{ role: 'minimize' }],
    },
  ];

  if (isMac) {
    menuTemplate.unshift(createMacMenu(appName, handlers));
  }

  return menuTemplate;
};

const createFileMenu = (
  handlers: MenuItemHandlers,
  showPrefs: boolean,
  showQuit: boolean,
  showAbout: boolean,
  recentFiles?: string[]
): MenuItemConstructorOptions => {
  const prefsSection: MenuItemConstructorOptions[] = showPrefs
    ? [
        { type: 'separator' },
        {
          label: 'Preferences',
          click: handlers.onPreferencesClicked,
        },
      ]
    : [];

  const aboutSection: MenuItemConstructorOptions[] = showAbout
    ? [
        { type: 'separator' },
        {
          label: 'About Lyricistant...',
          click: handlers.onAboutClicked,
        },
      ]
    : [];

  const quitSection: MenuItemConstructorOptions[] = showQuit
    ? [
        { type: 'separator' },
        {
          label: 'Quit',
          click: handlers.onQuitClicked,
          accelerator: 'Alt+F4',
        },
      ]
    : [];
  return {
    label: 'File',
    submenu: [
      {
        label: 'New',
        click: handlers.onNewClicked,
        accelerator: 'CmdOrCtrl+N',
      },
      { type: 'separator' },
      {
        label: 'Open...',
        click: handlers.onOpenClicked,
        accelerator: 'CmdOrCtrl+O',
      },
      {
        label: 'Open Recent',
        submenu: createRecentFilesSubmenu(handlers, recentFiles),
      },
      { type: 'separator' },
      {
        label: 'Save',
        click: handlers.onSaveClicked,
        accelerator: 'CmdOrCtrl+S',
      },
      {
        label: 'Save As...',
        click: handlers.onSaveAsClicked,
        accelerator: 'Shift+CmdOrCtrl+S',
      },
      ...prefsSection,
      ...aboutSection,
      ...quitSection,
    ],
  };
};

const createEditMenu = (
  handlers: MenuItemHandlers
): MenuItemConstructorOptions => ({
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      click: handlers.onUndoClicked,
      accelerator: 'CmdOrCtrl+Z',
    },
    {
      label: 'Redo',
      click: handlers.onRedoClicked,
      accelerator: 'Shift+CmdOrCtrl+Z',
    },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { type: 'separator' },
    {
      label: 'Find',
      accelerator: 'CmdOrCtrl+F',
      click: handlers.onFindClicked,
    },
    {
      label: 'Replace',
      accelerator: 'CmdOrCtrl+Shift+F',
      click: handlers.onReplaceClicked,
    },
  ],
});

const createRecentFilesSubmenu = (
  handlers: MenuItemHandlers,
  recentFiles?: string[]
): MenuItemConstructorOptions[] => {
  if (!recentFiles) {
    return [
      {
        label: '<No recent files>',
        enabled: false,
      },
    ];
  }
  return recentFiles.map((filePath: string) => ({
    label: filePath,
    click: () => handlers.onOpenRecentClicked(filePath),
  }));
};

const createMacMenu = (
  appName: string,
  handlers: MenuItemHandlers
): MenuItemConstructorOptions => ({
  label: appName,
  submenu: [
    {
      label: 'About Lyricistant...',
      click: handlers.onAboutClicked,
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      click: handlers.onPreferencesClicked,
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
      click: handlers.onQuitClicked,
      accelerator: 'Cmd+Q',
    },
  ],
});

const debounce = (callback: (...args: any[]) => void) => {
  let timeout: Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(this, args), 200);
  };
};
