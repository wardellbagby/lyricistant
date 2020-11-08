import { DIContainer } from '@wessberg/di';
import type { RendererDelegate } from 'common/main/Delegates';
import type { Dialogs } from 'common/main/dialogs/Dialogs';
import type { FileManager } from 'common/main/files/FileManager';
import type { Files } from 'common/main/files/Files';
import type { RecentFiles } from 'common/main/files/RecentFiles';
import type { Managers } from 'common/main/Managers';
import type { PreferenceManager } from 'common/main/preferences/PreferenceManager';
import type { Preferences } from 'common/main/preferences/Preferences';
import type { SystemThemeProvider } from 'common/main/theme/SystemTheme';
import type { TitleFormatter, UiConfigProvider } from 'common/main/ui/UiConfig';
import type { UiConfigManager } from 'common/main/ui/UiConfigManager';
import type { WebRendererDelegate } from './Delegates';
import type { WebDialogs } from './platform/Dialogs';
import type { WebFiles } from './platform/Files';
import type { WebLogger } from './platform/Logger';
import type { WebPreferences } from './platform/Preferences';
import type { WebRecentFiles } from './platform/RecentFiles';
import type { WebSystemThemeProvider } from './platform/SystemThemeProvider';
import { formatTitle, provideUiConfig } from './platform/UiConfigProvider';

export const initializeComponent = (component: DIContainer) => {
  component.registerSingleton<RendererDelegate, WebRendererDelegate>();

  component.registerSingleton<Dialogs, WebDialogs>();
  component.registerSingleton<Files, WebFiles>();
  component.registerSingleton<Logger, WebLogger>();
  component.registerSingleton<Preferences, WebPreferences>();
  component.registerSingleton<RecentFiles, WebRecentFiles>();
  component.registerSingleton<SystemThemeProvider, WebSystemThemeProvider>();
  component.registerSingleton<UiConfigProvider>(() => provideUiConfig);
  component.registerSingleton<TitleFormatter>(() => formatTitle);

  component.registerSingleton<FileManager>();
  component.registerSingleton<PreferenceManager>();
  component.registerSingleton<UiConfigManager>();

  component.registerSingleton<Managers>(() => [
    component.get<FileManager>(),
    component.get<PreferenceManager>(),
    component.get<UiConfigManager>(),
  ]);
};
