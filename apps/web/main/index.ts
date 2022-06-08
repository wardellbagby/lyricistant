import { Manager } from '@lyricistant/common-platform/Manager';
import { Managers } from '@lyricistant/common-platform/Managers';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { Logger } from '@lyricistant/common/Logger';
import { platformDelegate } from '@lyricistant/core-dom-platform/Delegates';
import { createComponent as createLegacyComponent } from '@web-app/LegacyAppComponent';
import { start as startNew } from '@web-renderer/index';
import { isChrome, isFirefox } from 'react-device-detect';

const startLegacy = async () => {
  const appComponent = createLegacyComponent();

  const logger = appComponent.get<Logger>();

  window.logger = logger;
  window.platformDelegate = platformDelegate;

  return new Promise<void>((resolve) => {
    appComponent
      .get<Managers>()
      .forEach((manager: Manager) => manager.register());
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

const useModernWeb = () => {
  const params = new URLSearchParams(location.search);
  const forceLegacy = isUnderTest && !!params.get('forceLegacy');
  return !forceLegacy && (isChrome || isFirefox);
};

const start = async () => {
  if (useModernWeb()) {
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
