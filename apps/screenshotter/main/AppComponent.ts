import type { Managers } from '@lyricistant/common/Managers';
import { DIContainer } from '@wessberg/di';
import { createBaseComponent } from '@lyricistant/core-platform/AppComponent';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';
import { UiConfigProvider } from '@lyricistant/common/ui/UiConfig';
import { provideUiConfig } from '@screenshotter-app/platform/UiConfigProvider';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { UiConfigManager } from '@lyricistant/common/ui/UiConfigManager';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import { LogManager } from '@lyricistant/common/logging/LogManager';
import { FileHistoryManager } from '@lyricistant/common/history/FileHistoryManager';

const createComponent = (): DIContainer => {
  const component = createBaseComponent();

  component.registerSingleton<Preferences, ScreenshotterPreferences>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);

  component.registerSingleton<Managers>(() => [
    () => component.get<FileManager>(),
    () => component.get<PreferenceManager>(),
    () => component.get<UiConfigManager>(),
    () => component.get<UnsavedDataManager>(),
    () => component.get<LogManager>(),
    () => component.get<FileHistoryManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
