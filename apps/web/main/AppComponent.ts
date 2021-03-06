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
import type { WebDialogs } from '@web-app/platform/Dialogs';
import type { WebFiles } from '@web-app/platform/Files';
import type { WebLogger } from '@web-app/platform/Logger';
import type { WebPreferences } from '@web-app/platform/Preferences';
import type { WebRecentFiles } from '@web-app/platform/RecentFiles';
import type { WebSystemThemeProvider } from '@web-app/platform/SystemThemeProvider';
import { WebTemporaryFiles } from '@web-app/platform/TemporaryFiles';
import {
  formatTitle,
  provideUiConfig,
} from '@web-app/platform/UiConfigProvider';
import { UnloadManager } from '@web-app/platform/UnloadManager';
import { FileSystem, WebFileSystem } from '@web-app/wrappers/FileSystem';
import type { WebRendererDelegate } from './Delegates';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<RendererDelegate, WebRendererDelegate>();

  component.registerSingleton<FileSystem, WebFileSystem>();

  component.registerSingleton<Dialogs, WebDialogs>();
  component.registerSingleton<Files, WebFiles>();
  component.registerSingleton<Logger, WebLogger>();
  component.registerSingleton<Preferences, WebPreferences>();
  component.registerSingleton<RecentFiles, WebRecentFiles>();
  component.registerSingleton<SystemThemeProvider, WebSystemThemeProvider>();
  component.registerSingleton<TemporaryFiles, WebTemporaryFiles>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<UnloadManager>();

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
