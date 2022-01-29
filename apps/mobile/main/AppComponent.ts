import type { Files } from '@lyricistant/common/files/Files';
import type { Managers } from '@lyricistant/common/Managers';
import type { SystemThemeProvider } from '@lyricistant/common/theme/SystemTheme';
import type {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';
import { DIContainer } from '@wessberg/di';
import type { MobileFiles } from '@mobile-app/platform/Files';
import type { MobileSystemThemeProvider } from '@mobile-app/platform/SystemThemeProvider';
import {
  formatTitle,
  provideUiConfig,
} from '@mobile-app/platform/UiConfigProvider';
import { StatusBarManager } from '@mobile-app/platform/StatusBarManager';
import {
  createBaseComponent,
  createBaseManagers,
} from '@lyricistant/core-platform/AppComponent';
import { BackButtonManager } from '@mobile-app/platform/BackButtonManager';

const createComponent = (): DIContainer => {
  const component = createBaseComponent();
  component.registerSingleton<Files, MobileFiles>();
  component.registerSingleton<SystemThemeProvider, MobileSystemThemeProvider>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<StatusBarManager>();
  component.registerSingleton<BackButtonManager>();

  component.registerSingleton<Managers>(() => [
    ...createBaseManagers(component),
    () => component.get<StatusBarManager>(),
    () => component.get<BackButtonManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
