import { DIContainer } from '@wessberg/di';
import { CoreRendererDelegate } from '@lyricistant/core-dom-platform/Delegates';
import {
  CoreFileSystem,
  FileSystem,
} from '@lyricistant/core-dom-platform/wrappers/FileSystem';
import { CoreFiles } from '@lyricistant/core-dom-platform/platform/Files';
import { CoreLogger } from '@lyricistant/core-dom-platform/platform/Logger';
import { CorePreferences } from '@lyricistant/core-dom-platform/platform/Preferences';
import { CoreRecentFiles } from '@lyricistant/core-dom-platform/platform/RecentFiles';
import { CoreSystemThemeProvider } from '@lyricistant/core-dom-platform/platform/SystemThemeProvider';
import { CoreTemporaryFiles } from '@lyricistant/core-dom-platform/platform/TemporaryFiles';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-dom-platform/platform/UiConfigProvider';
import { CoreBuffers } from '@lyricistant/core-dom-platform/platform/Buffers';
import {
  getCommonManagers,
  PlatformDependencies,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';

export const getCoreDOMManagers = getCommonManagers;

export const registerCoreDOMPlatform = (
  platformDependenciesOverrides: Partial<PlatformDependencies> = {},
  component: DIContainer
): DIContainer => {
  component.registerSingleton<CoreRendererDelegate>();
  component.registerSingleton<CoreLogger>();
  component.registerSingleton<CorePreferences>();
  component.registerSingleton<CoreRecentFiles>();
  component.registerSingleton<CoreTemporaryFiles>();
  component.registerSingleton<CoreFiles>();
  component.registerSingleton<CoreSystemThemeProvider>();
  component.registerSingleton<CoreBuffers>();

  component.registerSingleton<FileSystem, CoreFileSystem>();

  registerCommonPlatform(
    {
      rendererDelegate: () => component.get<CoreRendererDelegate>(),
      logger: () => component.get<CoreLogger>(),
      files: () => component.get<CoreFiles>(),
      preferences: () => component.get<CorePreferences>(),
      titleFormatter: () => formatTitle,
      buffers: () => component.get<CoreBuffers>(),
      temporaryFiles: () => component.get<CoreTemporaryFiles>(),
      systemThemeProvider: () => component.get<CoreSystemThemeProvider>(),
      recentFiles: () => component.get<CoreRecentFiles>(),
      uiConfigProvider: () => provideUiConfig,
      ...platformDependenciesOverrides,
    },
    component
  );
  return component;
};
