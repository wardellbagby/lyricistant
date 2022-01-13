import { start as startNew } from '@web-renderer/index';
import { isChrome, isFirefox } from 'react-device-detect';
import { Logger } from '@lyricistant/common/Logger';
import { platformDelegate } from '@lyricistant/core-platform/Delegates';
import { Managers } from '@lyricistant/common/Managers';
import {
  createBaseComponent,
  createBaseManagers,
} from '@lyricistant/core-platform/AppComponent';
import { UnloadManager } from '@lyricistant/core-platform/platform/UnloadManager';

const startLegacy = async () => {
  const appComponent = createBaseComponent();
  appComponent.registerSingleton<UnloadManager>();
  appComponent.registerSingleton<Managers>(() => [
    ...createBaseManagers(appComponent),
    () => appComponent.get<UnloadManager>(),
  ]);

  const logger = appComponent.get<Logger>();

  window.logger = logger;
  window.platformDelegate = platformDelegate;

  return new Promise<void>((resolve) => {
    appComponent.get<Managers>().forEach((manager) => manager().register());
    resolve();
  })
    .then(async () => {
      logger.info('Platform information', {
        appPlatform: 'Web - Legacy',
        version:
          (await import('@lyricistant/renderer/globals')).APP_VERSION ??
          'Error',
        userAgent: navigator.userAgent,
      });
    })
    .then(() => import('@lyricistant/renderer/index'))
    .catch((reason) => {
      throw Error(`Could not load the renderer page: ${reason}`);
    });
};

const start = async () => {
  if (isChrome || isFirefox) {
    return startNew();
  }
  return startLegacy();
};

start().catch((reason: any) => {
  if (reason instanceof Error) {
    throw reason;
  }
  throw Error(`Could not load the renderer page: ${reason}`);
});
