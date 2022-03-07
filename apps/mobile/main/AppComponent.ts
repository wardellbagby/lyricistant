import type { Managers } from '@lyricistant/common-platform/Managers';
import {
  getCoreDOMManagers,
  registerCoreDOMPlatform,
} from '@lyricistant/core-dom-platform/AppComponents';
import { BackButtonManager } from '@mobile-app/platform/BackButtonManager';
import type { MobileFiles } from '@mobile-app/platform/Files';
import { StatusBarManager } from '@mobile-app/platform/StatusBarManager';
import type { MobileSystemThemeProvider } from '@mobile-app/platform/SystemThemeProvider';
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

  component.registerSingleton<Managers>(() => [
    ...getCoreDOMManagers(component),
    component.get<StatusBarManager>(),
    component.get<BackButtonManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
