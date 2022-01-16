import type { Managers } from '@lyricistant/common/Managers';
import { DIContainer } from '@wessberg/di';
import {
  createBaseComponent,
  createBaseManagers,
} from '@lyricistant/core-platform/AppComponent';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';
import { UiConfigProvider } from '@lyricistant/common/ui/UiConfig';
import { provideUiConfig } from '@screenshotter-app/platform/UiConfigProvider';

const createComponent = (): DIContainer => {
  const component = createBaseComponent();

  component.registerSingleton<Preferences, ScreenshotterPreferences>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);

  component.registerSingleton<Managers>(() => [
    ...createBaseManagers(component),
  ]);
  return component;
};

export const appComponent = createComponent();
