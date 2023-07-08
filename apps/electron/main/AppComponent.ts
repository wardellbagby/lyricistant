import { ElectronAppData } from '@electron-app/platform/ElectronAppData';
import { ElectronBuffers } from '@electron-app/platform/ElectronBuffers';
import { ElectronFiles } from '@electron-app/platform/ElectronFiles';
import { ElectronLogger } from '@electron-app/platform/ElectronLogger';
import { ElectronPreferences } from '@electron-app/platform/ElectronPreferences';
import { ElectronRecentFiles } from '@electron-app/platform/ElectronRecentFiles';
import { ElectronSystemThemeProvider } from '@electron-app/platform/ElectronSystemThemeProvider';
import { ElectronTimes } from '@electron-app/platform/ElectronTimes';
import { NoopAppUpdater } from '@electron-app/platform/NoopAppUpdater';
import { QuitManager } from '@electron-app/platform/QuitManager';
import {
  formatTitle,
  provideUiConfig,
} from '@electron-app/platform/UiConfigProvider';
import { UpdateManager } from '@electron-app/platform/UpdateManager';
import { FileSystem, NodeFileSystem } from '@electron-app/wrappers/FileSystem';
import { AxiosHttpClient, HttpClient } from '@electron-app/wrappers/HttpClient';
import { ElectronRendererDelegate } from '@electron-delegates/Delegates';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { ReleaseHelper } from '@lyricistant/common/releases/ReleaseHelper';
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
  component.registerSingleton<AppUpdater>(() => {
    if (isUnderTest) {
      return new NoopAppUpdater();
    }
    return autoUpdater;
  });
  component.registerSingleton<ElectronDialog>(() => dialog);
  component.registerSingleton<FileSystem, NodeFileSystem>();
  component.registerSingleton<HttpClient, AxiosHttpClient>();
  component.registerSingleton<NativeTheme>(() => nativeTheme);
  component.registerSingleton<ReleaseHelper>();
};

const registerPlatformFunctionality = (component: DIContainer) => {
  component.registerSingleton<ElectronFiles>();
  component.registerSingleton<ElectronLogger>();
  component.registerSingleton<ElectronPreferences>();
  component.registerSingleton<ElectronRecentFiles>();
  component.registerSingleton<ElectronSystemThemeProvider>();
  component.registerSingleton<ElectronAppData>();
  component.registerSingleton<ElectronBuffers>();
  component.registerSingleton<ElectronTimes>();
  registerCommonPlatform(
    {
      rendererDelegate: () =>
        new ElectronRendererDelegate(ipcMain, component.get<BrowserWindow>()),
      files: () => component.get<ElectronFiles>(),
      logger: () => component.get<ElectronLogger>(),
      buffers: () => component.get<ElectronBuffers>(),
      preferences: () => component.get<ElectronPreferences>(),
      recentFiles: () => component.get<ElectronRecentFiles>(),
      appData: () => component.get<ElectronAppData>(),
      systemThemeProvider: () => component.get<ElectronSystemThemeProvider>(),
      titleFormatter: () => formatTitle,
      uiConfigProvider: () => provideUiConfig,
      times: () => component.get<ElectronTimes>(),
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
