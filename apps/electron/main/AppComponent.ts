import type { RendererDelegate } from '@lyricistant/common/Delegates';
import type { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import type { FileManager } from '@lyricistant/common/files/FileManager';
import type { Files } from '@lyricistant/common/files/Files';
import type { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import type { Logger } from '@lyricistant/common/Logger';
import { LogManager } from '@lyricistant/common/logging/LogManager';
import type { Managers } from '@lyricistant/common/Managers';
import type { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import type { Preferences } from '@lyricistant/common/preferences/Preferences';
import type { SystemThemeProvider } from '@lyricistant/common/theme/SystemTheme';
import type { TitleFormatter, UiConfigProvider } from '@lyricistant/common/ui/UiConfig';
import type { UiConfigManager } from '@lyricistant/common/ui/UiConfigManager';
import { DIContainer } from '@wessberg/di';
import {
  BrowserWindow,
  Dialog as ElectronDialog,
  dialog,
  ipcMain,
  nativeTheme,
  NativeTheme,
} from 'electron';
import { AppUpdater, autoUpdater } from 'electron-updater';
import { ElectronRendererDelegate } from '../packages/delegates/Delegates';
import { AppStore } from './AppStore';
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
import type { FileSystem, NodeFileSystem } from './wrappers/FileSystem';

const registerElectronFunctionality = (component: DIContainer) => {
  component.registerSingleton<ElectronDialog>(() => dialog);
  component.registerSingleton<FileSystem, NodeFileSystem>();
  component.registerSingleton<NativeTheme>(() => nativeTheme);
};
const registerPlatformFunctionality = (component: DIContainer) => {
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
};

const registerManagers = (component: DIContainer) => {
  component.registerSingleton<FileManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<QuitManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<UpdateManager>();

  component.registerTransient<Managers>(() => [
    () => component.get<FileManager>(),
    () => component.get<UnsavedDataManager>(),
    () => component.get<PreferenceManager>(),
    () => component.get<UiConfigManager>(),
    () => component.get<QuitManager>(),
    () => component.get<LogManager>(),
    () => component.get<UpdateManager>(),
  ]);
};

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerTransient<RendererDelegate>(
    () => new ElectronRendererDelegate(ipcMain, component.get<BrowserWindow>())
  );

  registerElectronFunctionality(component);
  registerPlatformFunctionality(component);
  registerManagers(component);
  return component;
};
export const createAppComponent = (window: BrowserWindow): DIContainer => {
  const component = createComponent();
  component.registerSingleton<BrowserWindow>(() => window);
  return component;
};
