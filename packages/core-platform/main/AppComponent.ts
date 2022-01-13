import { DIContainer } from '@wessberg/di';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { UiConfigManager } from '@lyricistant/common/ui/UiConfigManager';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import { LogManager } from '@lyricistant/common/logging/LogManager';
import { TextFileHandler } from '@lyricistant/common/files/handlers/TextFileHandler';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { CoreRendererDelegate } from '@lyricistant/core-platform/Delegates';
import {
  CoreFileSystem,
  FileSystem,
} from '@lyricistant/core-platform/wrappers/FileSystem';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { CoreDialogs } from '@lyricistant/core-platform/platform/Dialogs';
import { Files } from '@lyricistant/common/files/Files';
import { CoreFiles } from '@lyricistant/core-platform/platform/Files';
import { Logger } from '@lyricistant/common/Logger';
import { CoreLogger } from '@lyricistant/core-platform/platform/Logger';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { CorePreferences } from '@lyricistant/core-platform/platform/Preferences';
import { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import { CoreRecentFiles } from '@lyricistant/core-platform/platform/RecentFiles';
import { SystemThemeProvider } from '@lyricistant/common/theme/SystemTheme';
import { CoreSystemThemeProvider } from '@lyricistant/core-platform/platform/SystemThemeProvider';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { CoreTemporaryFiles } from '@lyricistant/core-platform/platform/TemporaryFiles';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';
import {
  formatTitle,
  provideUiConfig,
} from '@lyricistant/core-platform/platform/UiConfigProvider';
import { LyricistantFileHandler } from '@lyricistant/common/files/handlers/LyricistantFileHandler';
import { CoreBuffers } from '@lyricistant/core-platform/platform/Buffers';
import { Buffers } from '@lyricistant/common/files/Buffers';
import { FileHandlers } from '@lyricistant/common/files/handlers/FileHandler';
import { FileHistory } from '@lyricistant/common/history/FileHistory';
import { FileDataExtensions } from '@lyricistant/common/files/extensions/FileDataExtension';
import { FileHistoryManager } from '@lyricistant/common/history/FileHistoryManager';

export const createBaseManagers = (component: DIContainer) => [
  () => component.get<FileManager>(),
  () => component.get<PreferenceManager>(),
  () => component.get<UiConfigManager>(),
  () => component.get<UnsavedDataManager>(),
  () => component.get<LogManager>(),
  () => component.get<FileHistoryManager>(),
];
export const createBaseComponent = (): DIContainer => {
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
  component.registerSingleton<Buffers, CoreBuffers>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<FileHistoryManager>();

  component.registerSingleton<LyricistantFileHandler>();
  component.registerSingleton<TextFileHandler>();

  component.registerSingleton<FileHistory>();

  component.registerTransient<FileDataExtensions>(() => [
    component.get<FileHistory>(),
  ]);

  component.registerSingleton<FileHandlers>(() => [
    () => component.get<LyricistantFileHandler>(),
    () => component.get<TextFileHandler>(),
  ]);
  return component;
};
