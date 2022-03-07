import { DIContainer } from '@wessberg/di';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { PreferenceManager } from '@lyricistant/common-platform/preferences/PreferenceManager';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { LogManager } from '@lyricistant/common-platform/logging/LogManager';
import { FileHistoryManager } from '@lyricistant/common-platform/history/FileHistoryManager';
import { FirstLaunchManager } from '@lyricistant/common-platform/firstlaunch/FirstLaunchManager';
import { Logger } from '@lyricistant/common/Logger';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { TemporaryFiles } from '@lyricistant/common-platform/files/TemporaryFiles';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';
import { LyricistantFileHandler } from '@lyricistant/common-platform/files/handlers/LyricistantFileHandler';
import { TextFileHandler } from '@lyricistant/common-platform/files/handlers/TextFileHandler';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { FileDataExtensions } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import { FileHandlers } from '@lyricistant/common-platform/files/handlers/FileHandler';
import { Files } from '@lyricistant/common-platform/files/Files';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';

export type Provider<T> = () => T;

export interface PlatformDependencies {
  rendererDelegate: Provider<RendererDelegate>;
  files: Provider<Files>;
  logger: Provider<PlatformLogger>;
  preferences: Provider<Preferences>;
  recentFiles: Provider<RecentFiles>;
  systemThemeProvider: Provider<SystemThemeProvider>;
  temporaryFiles: Provider<TemporaryFiles>;
  buffers: Provider<Buffers>;
  uiConfigProvider: Provider<UiConfigProvider>;
  titleFormatter: Provider<TitleFormatter>;
}

export const getCommonManagers = (component: DIContainer) => [
  component.get<FileManager>(),
  component.get<PreferenceManager>(),
  component.get<UiConfigManager>(),
  component.get<UnsavedDataManager>(),
  component.get<LogManager>(),
  component.get<FileHistoryManager>(),
  component.get<FirstLaunchManager>(),
];
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
  component.registerTransient<TemporaryFiles>(dependencies.temporaryFiles);
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
