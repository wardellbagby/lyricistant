import { FileManager } from '@lyricistant/common/files/FileManager';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import { FileHistoryManager } from '@lyricistant/common/history/FileHistoryManager';
import { LogManager } from '@lyricistant/common/logging/LogManager';
import type { Managers } from '@lyricistant/common/Managers';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { UiConfigProvider } from '@lyricistant/common/ui/UiConfig';
import { UiConfigManager } from '@lyricistant/common/ui/UiConfigManager';
import { createBaseComponent } from '@lyricistant/core-platform/AppComponent';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';
import { provideUiConfig } from '@screenshotter-app/platform/UiConfigProvider';
import { DIContainer } from '@wessberg/di';

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
