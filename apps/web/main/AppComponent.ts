import type { Managers } from '@lyricistant/common/Managers';
import { DIContainer } from '@wessberg/di';
import { UnloadManager } from '@lyricistant/core-platform/platform/UnloadManager';
import {
  createBaseComponent,
  createBaseManagers,
} from '@lyricistant/core-platform/AppComponent';

const createComponent = (): DIContainer => {
  const component = createBaseComponent();

  component.registerSingleton<UnloadManager>();

  component.registerSingleton<Managers>(() => [
    ...createBaseManagers(component),
    () => component.get<UnloadManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
