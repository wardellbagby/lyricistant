import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import { FileDataExtensions } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { Files } from '@lyricistant/common-platform/files/Files';
import { FileHandlers } from '@lyricistant/common-platform/files/handlers/FileHandler';
import { LyricistantFileHandler } from '@lyricistant/common-platform/files/handlers/LyricistantFileHandler';
import { TextFileHandler } from '@lyricistant/common-platform/files/handlers/TextFileHandler';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { FirstLaunchManager } from '@lyricistant/common-platform/firstlaunch/FirstLaunchManager';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { FileHistoryManager } from '@lyricistant/common-platform/history/FileHistoryManager';
import { LogManager } from '@lyricistant/common-platform/logging/LogManager';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { Manager } from '@lyricistant/common-platform/Manager';
import { Managers } from '@lyricistant/common-platform/Managers';
import { PreferenceManager } from '@lyricistant/common-platform/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { DIContainer } from '@wessberg/di';

export type Provider<T> = () => T;

export interface PlatformDependencies {
  rendererDelegate: Provider<RendererDelegate>;
  files: Provider<Files>;
  logger: Provider<PlatformLogger>;
  preferences: Provider<Preferences>;
  recentFiles: Provider<RecentFiles>;
  systemThemeProvider: Provider<SystemThemeProvider>;
  appData: Provider<AppData>;
  buffers: Provider<Buffers>;
  uiConfigProvider: Provider<UiConfigProvider>;
  titleFormatter: Provider<TitleFormatter>;
}

/**
 * Registers all the common managers plus any extra managers that are passed
 * in so that they can be retrieved by querying {@param component} for
 * {@link Managers}.
 *
 * Note: This should always be invoked after {@link registerCommonPlatform}.
 *
 * @param component The component to register the managers to.
 * @param extraManagers Extra managers the platform would like to register as
 * well.
 */
export const registerCommonManagers = (
  component: DIContainer,
  ...extraManagers: Manager[]
) => {
  component.registerSingleton<Managers>(() => [
    component.get<FileManager>(),
    component.get<PreferenceManager>(),
    component.get<UiConfigManager>(),
    component.get<UnsavedDataManager>(),
    component.get<LogManager>(),
    component.get<FileHistoryManager>(),
    component.get<FirstLaunchManager>(),
    ...extraManagers,
  ]);
};

/**
 * Register the necessary functionality and the dependencies for that
 * functionality for the common platform.
 *
 * @param dependencies The platform implementations of dependencies the common
 * platform needs.
 * @param component The DI container to register to.
 */
export const registerCommonPlatform = (
  dependencies: PlatformDependencies,
  component: DIContainer
): DIContainer => {
  component.registerTransient<Files>(dependencies.files);
  component.registerTransient<Logger>(dependencies.logger);
  component.registerTransient<PlatformLogger>(dependencies.logger);
  component.registerTransient<Preferences>(dependencies.preferences);
  component.registerTransient<RecentFiles>(dependencies.recentFiles);
  component.registerTransient<SystemThemeProvider>(
    dependencies.systemThemeProvider
  );
  component.registerTransient<AppData>(dependencies.appData);
  component.registerTransient<Buffers>(dependencies.buffers);
  component.registerTransient<UiConfigProvider>(dependencies.uiConfigProvider);
  component.registerTransient<TitleFormatter>(dependencies.titleFormatter);
  component.registerTransient<RendererDelegate>(dependencies.rendererDelegate);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();
  component.registerSingleton<UnsavedDataManager>();
  component.registerSingleton<LogManager>();
  component.registerSingleton<FileHistoryManager>();
  component.registerSingleton<FirstLaunchManager>();

  component.registerSingleton<LyricistantFileHandler>();
  component.registerSingleton<TextFileHandler>();

  component.registerSingleton<FileHistory>();

  component.registerSingleton<FileDataExtensions>(() => [
    component.get<FileHistory>(),
  ]);

  component.registerSingleton<FileHandlers>(() => [
    component.get<LyricistantFileHandler>(),
    component.get<TextFileHandler>(),
  ]);
  return component;
};
