import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { FileHistoryManager } from '@lyricistant/common-platform/history/FileHistoryManager';
import { LogManager } from '@lyricistant/common-platform/logging/LogManager';
import { Managers } from '@lyricistant/common-platform/Managers';
import { PreferenceManager } from '@lyricistant/common-platform/preferences/PreferenceManager';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import { registerCoreDOMPlatform } from '@lyricistant/core-dom-platform/AppComponents';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';
import { provideUiConfig } from '@screenshotter-app/platform/UiConfigProvider';
import { DIContainer } from '@wessberg/di';

const createComponent = (): DIContainer => {
  const component = new DIContainer();

  component.registerSingleton<ScreenshotterPreferences>();

  registerCoreDOMPlatform(
    {
      preferences: () => component.get<ScreenshotterPreferences>(),
      uiConfigProvider: () => provideUiConfig,
    },
    component,
  );

  // Purposefully doesn't use getCoreDOMManagers, so it doesn't include the FirstLaunchManager.
  component.registerSingleton<Managers>(() => [
    component.get<FileManager>(),
    component.get<PreferenceManager>(),
    component.get<UiConfigManager>(),
    component.get<UnsavedDataManager>(),
    component.get<LogManager>(),
    component.get<FileHistoryManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
