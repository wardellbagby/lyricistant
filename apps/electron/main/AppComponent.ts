import { AppStore } from '@electron-app/AppStore';
import { ElectronBuffers } from '@electron-app/platform/Buffers';
import type { ElectronFiles } from '@electron-app/platform/Files';
import type { ElectronLogger } from '@electron-app/platform/Logger';
import type { ElectronPreferences } from '@electron-app/platform/Preferences';
import type { QuitManager } from '@electron-app/platform/QuitManager';
import type { ElectronRecentFiles } from '@electron-app/platform/RecentFiles';
import type { ElectronSystemThemeProvider } from '@electron-app/platform/SystemThemeProvider';
import { ElectronTemporaryFiles } from '@electron-app/platform/TemporaryFiles';
import {
  formatTitle,
  provideUiConfig,
} from '@electron-app/platform/UiConfigProvider';
import { UpdateManager } from '@electron-app/platform/UpdateManager';
import type {
  FileSystem,
  NodeFileSystem,
} from '@electron-app/wrappers/FileSystem';
import { AxiosHttpClient, HttpClient } from '@electron-app/wrappers/HttpClient';
import { ElectronRendererDelegate } from '@electron-delegates/Delegates';
import {
  registerCommonManagers,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';
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

const registerElectronFunctionality = (
  component: DIContainer,
  window: BrowserWindow
) => {
  component.registerSingleton<BrowserWindow>(() => window);
  component.registerSingleton<AppStore>();
  component.registerSingleton<AppUpdater>(() => autoUpdater);
  component.registerSingleton<ElectronDialog>(() => dialog);
  component.registerSingleton<FileSystem, NodeFileSystem>();
  component.registerSingleton<HttpClient, AxiosHttpClient>();
  component.registerSingleton<NativeTheme>(() => nativeTheme);
};

const registerPlatformFunctionality = (component: DIContainer) => {
  component.registerSingleton<ElectronFiles>();
  component.registerSingleton<ElectronLogger>();
  component.registerSingleton<ElectronPreferences>();
  component.registerSingleton<ElectronRecentFiles>();
  component.registerSingleton<ElectronSystemThemeProvider>();
  component.registerSingleton<ElectronTemporaryFiles>();
  component.registerSingleton<ElectronBuffers>();
  registerCommonPlatform(
    {
      rendererDelegate: () =>
        new ElectronRendererDelegate(ipcMain, component.get<BrowserWindow>()),
      files: () => component.get<ElectronFiles>(),
      logger: () => component.get<ElectronLogger>(),
      buffers: () => component.get<ElectronBuffers>(),
      preferences: () => component.get<ElectronPreferences>(),
      recentFiles: () => component.get<ElectronRecentFiles>(),
      temporaryFiles: () => component.get<ElectronTemporaryFiles>(),
      systemThemeProvider: () => component.get<ElectronSystemThemeProvider>(),
      titleFormatter: () => formatTitle,
      uiConfigProvider: () => provideUiConfig,
    },
    component
  );
};

const registerManagers = (component: DIContainer) => {
  component.registerSingleton<QuitManager>();
  component.registerSingleton<UpdateManager>();

  registerCommonManagers(
    component,
    component.get<QuitManager>(),
    component.get<UpdateManager>()
  );
};

export const createAppComponent = (window: BrowserWindow): DIContainer => {
  const component = new DIContainer();

  registerElectronFunctionality(component, window);
  registerPlatformFunctionality(component);
  registerManagers(component);

  return component;
};
