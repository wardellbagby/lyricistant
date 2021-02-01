import type { RendererDelegate } from '@common/Delegates';
import type { Dialogs } from '@common/dialogs/Dialogs';
import type { FileManager } from '@common/files/FileManager';
import type { Files } from '@common/files/Files';
import type { RecentFiles } from '@common/files/RecentFiles';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { UnsavedDataManager } from '@common/files/UnsavedDataManager';
import type { Logger } from '@common/Logger';
import { LogManager } from '@common/logging/LogManager';
import type { Managers } from '@common/Managers';
import type { PreferenceManager } from '@common/preferences/PreferenceManager';
import type { Preferences } from '@common/preferences/Preferences';
import type { SystemThemeProvider } from '@common/theme/SystemTheme';
import type { TitleFormatter, UiConfigProvider } from '@common/ui/UiConfig';
import type { UiConfigManager } from '@common/ui/UiConfigManager';
import { DIContainer } from '@wessberg/di';
import type { WebRendererDelegate } from './Delegates';
import type { WebDialogs } from './platform/Dialogs';
import type { WebFiles } from './platform/Files';
import type { WebLogger } from './platform/Logger';
import type { WebPreferences } from './platform/Preferences';
import type { WebRecentFiles } from './platform/RecentFiles';
import type { WebSystemThemeProvider } from './platform/SystemThemeProvider';
import { WebTemporaryFiles } from './platform/TemporaryFiles';
import { formatTitle, provideUiConfig } from './platform/UiConfigProvider';
import { UnloadManager } from './platform/UnloadManager';
import { FileSystem, WebFileSystem } from './wrappers/FileSystem';

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
