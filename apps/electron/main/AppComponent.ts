import type { RendererDelegate } from '@common/Delegates';
import type { Dialogs } from '@common/dialogs/Dialogs';
import type { FileManager } from '@common/files/FileManager';
import type { Files } from '@common/files/Files';
import type { RecentFiles } from '@common/files/RecentFiles';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { UnsavedDataManager } from '@common/files/UnsavedDataManager';
import type { Logger } from '@common/Logger';
import { LogManager } from '@common/logging/LogManager';
import type { Managers } from '@common/Managers';
import type { PreferenceManager } from '@common/preferences/PreferenceManager';
import type { Preferences } from '@common/preferences/Preferences';
import type { SystemThemeProvider } from '@common/theme/SystemTheme';
import type { TitleFormatter, UiConfigProvider } from '@common/ui/UiConfig';
import type { UiConfigManager } from '@common/ui/UiConfigManager';
import { DIContainer } from '@wessberg/di';
import { BrowserWindow, ipcMain } from 'electron';
import { AppUpdater, autoUpdater } from "electron-updater";
import { AppStore } from './AppStore';
import { ElectronRendererDelegate } from './Delegates';
import type { ElectronDialogs } from './platform/Dialogs';
import type { ElectronFiles } from './platform/Files';
import type { ElectronLogger } from './platform/Logger';
import type { ElectronPreferences } from './platform/Preferences';
import type { QuitManager } from './platform/QuitManager';
import type { ElectronRecentFiles } from './platform/RecentFiles';
import type { ElectronSystemThemeProvider } from './platform/SystemThemeProvider';
import { ElectronTemporaryFiles } from './platform/TemporaryFiles';
import { formatTitle, provideUiConfig } from './platform/UiConfigProvider';
import { UpdateManager } from './platform/UpdateManager';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerTransient<RendererDelegate>(() => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw Error(
        'Tried to initialize an ElectronRendererDelegate with no mainWindow!'
      );
    }
    return new ElectronRendererDelegate(ipcMain, mainWindow);
  });

  component.registerSingleton<AppStore>();
  component.registerSingleton<Dialogs, ElectronDialogs>();
  component.registerSingleton<Files, ElectronFiles>();
  component.registerSingleton<Logger, ElectronLogger>();
  component.registerSingleton<Preferences, ElectronPreferences>();
  component.registerSingleton<RecentFiles, ElectronRecentFiles>();
  component.registerSingleton<
    SystemThemeProvider,
    ElectronSystemThemeProvider
  >();
  component.registerSingleton<TemporaryFiles, ElectronTemporaryFiles>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);
  component.registerSingleton<AppUpdater>(() => autoUpdater);

  component.registerSingleton<FileManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<QuitManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<UpdateManager>();

  component.registerTransient<Managers>(() => [
    component.get<FileManager>(),
    component.get<UnsavedDataManager>(),
    component.get<PreferenceManager>(),
    component.get<UiConfigManager>(),
    component.get<QuitManager>(),
    component.get<LogManager>(),
    component.get<UpdateManager>(),
  ]);
  return component;
};
export const appComponent = createComponent();
