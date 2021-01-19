import { Logger } from '@common/Logger';
import { Managers } from '@common/Managers';
import { appComponent } from './AppComponent';
import { platformDelegate } from './Delegates';

const logger = appComponent.get<Logger>();

window.logger = logger;
window.platformDelegate = platformDelegate;

new Promise((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(async () => {
    logger.info('Platform information', {
      appPlatform: 'Web',
      version: (await import('@renderer/globals')).APP_VERSION ?? 'Error',
      userAgent: navigator.userAgent,
    });
  })
  .then(() => import('@renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
