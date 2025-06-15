import {
  registerCommonManagers,
  PlatformDependencies,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';
import { DOMRendererDelegate } from '@lyricistant/core-dom-platform/Delegates';
import { DOMAppData } from '@lyricistant/core-dom-platform/platform/DOMAppData';
import { DOMBuffers } from '@lyricistant/core-dom-platform/platform/DOMBuffers';
import { DOMFiles } from '@lyricistant/core-dom-platform/platform/DOMFiles';
import { DOMLogger } from '@lyricistant/core-dom-platform/platform/DOMLogger';
import { DOMPreferences } from '@lyricistant/core-dom-platform/platform/DOMPreferences';
import { DOMRecentFiles } from '@lyricistant/core-dom-platform/platform/DOMRecentFiles';
import { DOMSystemThemeProvider } from '@lyricistant/core-dom-platform/platform/DOMSystemThemeProvider';
import { DOMTimes } from '@lyricistant/core-dom-platform/platform/DOMTimes';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-dom-platform/platform/UiConfigProvider';
import {
  DOMFileSystem,
  FileSystem,
} from '@lyricistant/core-dom-platform/wrappers/FileSystem';
import { DIContainer } from '@wessberg/di';

export const registerCoreDOMManagers = registerCommonManagers;

export const registerCoreDOMPlatform = (
  platformDependenciesOverrides: Partial<PlatformDependencies> = {},
  component: DIContainer,
): DIContainer => {
  component.registerSingleton<DOMRendererDelegate>();
  component.registerSingleton<DOMLogger>();
  component.registerSingleton<DOMPreferences>();
  component.registerSingleton<DOMRecentFiles>();
  component.registerSingleton<DOMAppData>();
  component.registerSingleton<DOMFiles>();
  component.registerSingleton<DOMSystemThemeProvider>();
  component.registerSingleton<DOMBuffers>();
  component.registerSingleton<DOMTimes>();

  component.registerSingleton<FileSystem, DOMFileSystem>();

  registerCommonPlatform(
    {
      rendererDelegate: () => component.get<DOMRendererDelegate>(),
      logger: () => component.get<DOMLogger>(),
      files: () => component.get<DOMFiles>(),
      preferences: () => component.get<DOMPreferences>(),
      titleFormatter: () => formatTitle,
      buffers: () => component.get<DOMBuffers>(),
      appData: () => component.get<DOMAppData>(),
      systemThemeProvider: () => component.get<DOMSystemThemeProvider>(),
      recentFiles: () => component.get<DOMRecentFiles>(),
      uiConfigProvider: () => provideUiConfig,
      times: () => component.get<DOMTimes>(),
      ...platformDependenciesOverrides,
    },
    component,
  );
  return component;
};
