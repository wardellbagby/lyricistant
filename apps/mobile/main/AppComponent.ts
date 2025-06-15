import {
  registerCoreDOMManagers,
  registerCoreDOMPlatform,
} from '@lyricistant/core-dom-platform/AppComponents';
import { BackButtonManager } from '@mobile-app/platform/BackButtonManager';
import { MobileFiles } from '@mobile-app/platform/MobileFiles';
import { MobilePreferences } from '@mobile-app/platform/MobilePreferences';
import { MobileSystemThemeProvider } from '@mobile-app/platform/MobileSystemThemeProvider';
import { SoftKeyboardManager } from '@mobile-app/platform/SoftKeyboardManager';
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
  component.registerSingleton<MobilePreferences>();

  registerCoreDOMPlatform(
    {
      files: () => component.get<MobileFiles>(),
      systemThemeProvider: () => component.get<MobileSystemThemeProvider>(),
      uiConfigProvider: () => provideUiConfig,
      titleFormatter: () => formatTitle,
      preferences: () => component.get<MobilePreferences>(),
    },
    component,
  );

  component.registerSingleton<StatusBarManager>();
  component.registerSingleton<BackButtonManager>();
  component.registerSingleton<SoftKeyboardManager>();

  registerCoreDOMManagers(
    component,
    component.get<StatusBarManager>(),
    component.get<BackButtonManager>(),
    component.get<SoftKeyboardManager>(),
  );
  return component;
};

export const appComponent = createComponent();
