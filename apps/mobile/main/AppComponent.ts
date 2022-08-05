import {
  registerCoreDOMManagers,
  registerCoreDOMPlatform,
} from '@lyricistant/core-dom-platform/AppComponents';
import { BackButtonManager } from '@mobile-app/platform/BackButtonManager';
import { MobileFiles } from '@mobile-app/platform/MobileFiles';
import { MobileSystemThemeProvider } from '@mobile-app/platform/MobileSystemThemeProvider';
import { StatusBarManager } from '@mobile-app/platform/StatusBarManager';
import {
  formatTitle,
  provideUiConfig,
} from '@mobile-app/platform/UiConfigProvider';
import { DIContainer } from '@wessberg/di';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<MobileFiles>();
  component.registerSingleton<MobileSystemThemeProvider>();

  registerCoreDOMPlatform(
    {
      files: () => component.get<MobileFiles>(),
      systemThemeProvider: () => component.get<MobileSystemThemeProvider>(),
      uiConfigProvider: () => provideUiConfig,
      titleFormatter: () => formatTitle,
    },
    component
  );

  component.registerSingleton<StatusBarManager>();
  component.registerSingleton<BackButtonManager>();

  registerCoreDOMManagers(
    component,
    component.get<StatusBarManager>(),
    component.get<BackButtonManager>()
  );
  return component;
};

export const appComponent = createComponent();
