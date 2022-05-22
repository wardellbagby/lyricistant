import {
  registerCommonManagers,
  PlatformDependencies,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';
import { CoreRendererDelegate } from '@lyricistant/core-dom-platform/Delegates';
import { CoreAppData } from '@lyricistant/core-dom-platform/platform/AppData';
import { CoreBuffers } from '@lyricistant/core-dom-platform/platform/Buffers';
import { CoreFiles } from '@lyricistant/core-dom-platform/platform/Files';
import { CoreLogger } from '@lyricistant/core-dom-platform/platform/Logger';
import { CorePreferences } from '@lyricistant/core-dom-platform/platform/Preferences';
import { CoreRecentFiles } from '@lyricistant/core-dom-platform/platform/RecentFiles';
import { CoreSystemThemeProvider } from '@lyricistant/core-dom-platform/platform/SystemThemeProvider';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-dom-platform/platform/UiConfigProvider';
import {
  CoreFileSystem,
  FileSystem,
} from '@lyricistant/core-dom-platform/wrappers/FileSystem';
import { DIContainer } from '@wessberg/di';

export const registerCoreDOMManagers = registerCommonManagers;

export const registerCoreDOMPlatform = (
  platformDependenciesOverrides: Partial<PlatformDependencies> = {},
  component: DIContainer
): DIContainer => {
  component.registerSingleton<CoreRendererDelegate>();
  component.registerSingleton<CoreLogger>();
  component.registerSingleton<CorePreferences>();
  component.registerSingleton<CoreRecentFiles>();
  component.registerSingleton<CoreAppData>();
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
      appData: () => component.get<CoreAppData>(),
      systemThemeProvider: () => component.get<CoreSystemThemeProvider>(),
      recentFiles: () => component.get<CoreRecentFiles>(),
      uiConfigProvider: () => provideUiConfig,
      ...platformDependenciesOverrides,
    },
    component
  );
  return component;
};
