import { Managers } from '@lyricistant/common-platform/Managers';
import {
  getCoreDOMManagers,
  registerCoreDOMPlatform,
} from '@lyricistant/core-dom-platform/AppComponents';
import { UnloadManager } from '@lyricistant/core-dom-platform/platform/UnloadManager';
import { DIContainer } from '@wessberg/di';

/**
 * Create an app component that can be used to run the legacy, non Web Worker-based
 * Lyricistant.
 */
export const createComponent = (): DIContainer => {
  const component = new DIContainer();

  registerCoreDOMPlatform({}, component);
  component.registerSingleton<UnloadManager>();

  component.registerSingleton<Managers>(() => [
    ...getCoreDOMManagers(component),
    component.get<UnloadManager>(),
  ]);
  return component;
};

export const appComponent = createComponent();
