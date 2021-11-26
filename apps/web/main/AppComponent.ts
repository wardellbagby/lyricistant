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
import type { CoreDialogs } from '@lyricistant/core-platform/platform/Dialogs';
import type { CoreFiles } from '@lyricistant/core-platform/platform/Files';
import type { CoreLogger } from '@lyricistant/core-platform/platform/Logger';
import type { CorePreferences } from '@lyricistant/core-platform/platform/Preferences';
import type { CoreRecentFiles } from '@lyricistant/core-platform/platform/RecentFiles';
import type { CoreSystemThemeProvider } from '@lyricistant/core-platform/platform/SystemThemeProvider';
import { CoreTemporaryFiles } from '@lyricistant/core-platform/platform/TemporaryFiles';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-platform/platform/UiConfigProvider';
import { UnloadManager } from '@lyricistant/core-platform/platform/UnloadManager';
import {
  FileSystem,
  CoreFileSystem,
} from '@lyricistant/core-platform/wrappers/FileSystem';
import type { CoreRendererDelegate } from '@lyricistant/core-platform/Delegates';
import { LyricistantFileHandler } from '@lyricistant/common/files/handlers/LyricistantFileHandler';
import { TextFileHandler } from '@lyricistant/common/files/handlers/TextFileHandler';
import {
  FileHandler,
  FileHandlers,
} from '@lyricistant/common/files/handlers/FileHandler';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<RendererDelegate, CoreRendererDelegate>();

  component.registerSingleton<FileSystem, CoreFileSystem>();

  component.registerSingleton<Dialogs, CoreDialogs>();
  component.registerSingleton<Files, CoreFiles>();
  component.registerSingleton<Logger, CoreLogger>();
  component.registerSingleton<Preferences, CorePreferences>();
  component.registerSingleton<RecentFiles, CoreRecentFiles>();
  component.registerSingleton<SystemThemeProvider, CoreSystemThemeProvider>();
  component.registerSingleton<TemporaryFiles, CoreTemporaryFiles>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<UnloadManager>();

  component.registerSingleton<LyricistantFileHandler>();
  component.registerSingleton<TextFileHandler>();

  component.registerSingleton<FileHandlers>(() => [
    () => component.get<LyricistantFileHandler>(),
    () => component.get<TextFileHandler>(),
  ]);

  component.registerSingleton<Managers>(() => [
    () => component.get<FileManager>(),
    () => component.get<PreferenceManager>(),
    () => component.get<UiConfigManager>(),
    () => component.get<UnsavedDataManager>(),
    () => component.get<LogManager>(),
    () => component.get<UnloadManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
