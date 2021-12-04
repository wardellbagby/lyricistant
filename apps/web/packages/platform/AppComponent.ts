import type { Managers } from '@lyricistant/common/Managers';
import { DIContainer } from '@wessberg/di';
import { UnloadManager } from '@lyricistant/core-platform/platform/UnloadManager';
import {
  createBaseComponent,
  createBaseManagers,
} from '@lyricistant/core-platform/AppComponent';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { WebPreferences } from '@web-platform/implementations/WebPreferences';
import { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import { WebRecentFiles } from '@web-platform/implementations/WebRecentFiles';
import { Files } from '@lyricistant/common/files/Files';
import { WebFiles } from '@web-platform/implementations/WebFiles';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { WebTemporaryFiles } from '@web-platform/implementations/WebTemporaryFiles';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { WebDialogs } from '@web-platform/implementations/WebDialogs';
import { WebRendererDelegate } from './RendererDelegate';

const createComponent = (): DIContainer => {
  const component = createBaseComponent();

  component.registerSingleton<RendererDelegate, WebRendererDelegate>();
  component.registerSingleton<UnloadManager>();
  component.registerSingleton<Preferences, WebPreferences>();
  component.registerSingleton<RecentFiles, WebRecentFiles>();
  component.registerSingleton<TemporaryFiles, WebTemporaryFiles>();
  component.registerSingleton<Dialogs, WebDialogs>();
  component.registerSingleton<Files, WebFiles>();

  component.registerSingleton<Managers>(() => [
    ...createBaseManagers(component),
    () => component.get<UnloadManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
