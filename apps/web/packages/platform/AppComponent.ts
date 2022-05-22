import {
  registerCommonManagers,
  registerCommonPlatform,
} from '@lyricistant/common-platform/AppComponents';
import { DOMBuffers } from '@lyricistant/core-dom-platform/platform/DOMBuffers';
import { DOMSystemThemeProvider } from '@lyricistant/core-dom-platform/platform/DOMSystemThemeProvider';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-dom-platform/platform/UiConfigProvider';
import { UnloadManager } from '@lyricistant/core-dom-platform/platform/UnloadManager';
import { WebAppData } from '@web-platform/implementations/WebAppData';
import { WebFiles } from '@web-platform/implementations/WebFiles';
import { WebLogger } from '@web-platform/implementations/WebLogger';
import { WebPreferences } from '@web-platform/implementations/WebPreferences';
import { WebRecentFiles } from '@web-platform/implementations/WebRecentFiles';
import { DIContainer } from '@wessberg/di';
import { WebRendererDelegate } from './RendererDelegate';

const createComponent = (): DIContainer => {
  const component = new DIContainer();

  component.registerSingleton<WebRendererDelegate>();
  component.registerSingleton<WebLogger>();
  component.registerSingleton<WebPreferences>();
  component.registerSingleton<WebRecentFiles>();
  component.registerSingleton<WebAppData>();
  component.registerSingleton<WebFiles>();
  component.registerSingleton<DOMSystemThemeProvider>();
  component.registerSingleton<DOMBuffers>();

  registerCommonPlatform(
    {
      rendererDelegate: () => component.get<WebRendererDelegate>(),
      logger: () => component.get<WebLogger>(),
      files: () => component.get<WebFiles>(),
      preferences: () => component.get<WebPreferences>(),
      titleFormatter: () => formatTitle,
      buffers: () => component.get<DOMBuffers>(),
      appData: () => component.get<WebAppData>(),
      systemThemeProvider: () => component.get<DOMSystemThemeProvider>(),
      recentFiles: () => component.get<WebRecentFiles>(),
      uiConfigProvider: () => provideUiConfig,
    },
    component
  );
  component.registerSingleton<UnloadManager>();

  registerCommonManagers(component, component.get<UnloadManager>());
  return component;
};

export const appComponent = createComponent();
