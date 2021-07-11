import type { RendererDelegate } from '@lyricistant/common/Delegates';
import type { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import type { FileManager } from '@lyricistant/common/files/FileManager';
import type { Files } from '@lyricistant/common/files/Files';
import type { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import type { Logger } from '@lyricistant/common/Logger';
import { LogManager } from '@lyricistant/common/logging/LogManager';
import type { Managers } from '@lyricistant/common/Managers';
import type { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import type { Preferences } from '@lyricistant/common/preferences/Preferences';
import type { SystemThemeProvider } from '@lyricistant/common/theme/SystemTheme';
import type {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';
import type { UiConfigManager } from '@lyricistant/common/ui/UiConfigManager';
import { DIContainer } from '@wessberg/di';
import type { MobileDialogs } from '@mobile-app/platform/Dialogs';
import type { MobileFiles } from '@mobile-app/platform/Files';
import type { MobileLogger } from '@mobile-app/platform/Logger';
import type { MobilePreferences } from '@mobile-app/platform/Preferences';
import type { MobileRecentFiles } from '@mobile-app/platform/RecentFiles';
import type { MobileSystemThemeProvider } from '@mobile-app/platform/SystemThemeProvider';
import { MobileTemporaryFiles } from '@mobile-app/platform/TemporaryFiles';
import {
  formatTitle,
  provideUiConfig,
} from '@mobile-app/platform/UiConfigProvider';
import { FileSystem, MobileFileSystem } from '@mobile-app/wrappers/FileSystem';
import { SplashScreenManager } from '@mobile-app/platform/SplashScreenManager';
import type { MobileRendererDelegate } from './Delegates';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<RendererDelegate, MobileRendererDelegate>();

  component.registerSingleton<FileSystem, MobileFileSystem>();

  component.registerSingleton<Dialogs, MobileDialogs>();
  component.registerSingleton<Files, MobileFiles>();
  component.registerSingleton<Logger, MobileLogger>();
  component.registerSingleton<Preferences, MobilePreferences>();
  component.registerSingleton<RecentFiles, MobileRecentFiles>();
  component.registerSingleton<SystemThemeProvider, MobileSystemThemeProvider>();
  component.registerSingleton<TemporaryFiles, MobileTemporaryFiles>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<SplashScreenManager>();

  component.registerSingleton<Managers>(() => [
    () => component.get<FileManager>(),
    () => component.get<PreferenceManager>(),
    () => component.get<UiConfigManager>(),
    () => component.get<UnsavedDataManager>(),
    () => component.get<LogManager>(),
    () => component.get<SplashScreenManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
