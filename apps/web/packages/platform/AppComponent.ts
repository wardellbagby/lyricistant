import type { Managers } from '@lyricistant/common-platform/Managers';
import { DIContainer } from '@wessberg/di';
import { UnloadManager } from '@lyricistant/core-dom-platform/platform/UnloadManager';
import {
  getCommonManagers,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';
import { WebPreferences } from '@web-platform/implementations/WebPreferences';
import { WebRecentFiles } from '@web-platform/implementations/WebRecentFiles';
import { WebFiles } from '@web-platform/implementations/WebFiles';
import { WebTemporaryFiles } from '@web-platform/implementations/WebTemporaryFiles';
import { WebLogger } from '@web-platform/implementations/WebLogger';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-dom-platform/platform/UiConfigProvider';
import { CoreBuffers } from '@lyricistant/core-dom-platform/platform/Buffers';
import { CoreSystemThemeProvider } from '@lyricistant/core-dom-platform/platform/SystemThemeProvider';
import { WebRendererDelegate } from './RendererDelegate';

const createComponent = (): DIContainer => {
  const component = new DIContainer();

  component.registerSingleton<WebRendererDelegate>();
  component.registerSingleton<WebLogger>();
  component.registerSingleton<WebPreferences>();
  component.registerSingleton<WebRecentFiles>();
  component.registerSingleton<WebTemporaryFiles>();
  component.registerSingleton<WebFiles>();
  component.registerSingleton<CoreSystemThemeProvider>();
  component.registerSingleton<CoreBuffers>();

  registerCommonPlatform(
    {
      rendererDelegate: () => component.get<WebRendererDelegate>(),
      logger: () => component.get<WebLogger>(),
      files: () => component.get<WebFiles>(),
      preferences: () => component.get<WebPreferences>(),
      titleFormatter: () => formatTitle,
      buffers: () => component.get<CoreBuffers>(),
      temporaryFiles: () => component.get<WebTemporaryFiles>(),
      systemThemeProvider: () => component.get<CoreSystemThemeProvider>(),
      recentFiles: () => component.get<WebRecentFiles>(),
      uiConfigProvider: () => provideUiConfig,
    },
    component
  );
  component.registerSingleton<UnloadManager>();

  component.registerSingleton<Managers>(() => [
    ...getCommonManagers(component),
    component.get<UnloadManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
