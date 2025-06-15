if (module.hot) {
  module.hot.accept();
}

import { Logger } from '@lyricistant/common/Logger';
import { Managers } from '@lyricistant/common-platform/Managers';
import { platformDelegate } from '@lyricistant/core-dom-platform/Delegates';
import { appComponent } from '@mobile-app/AppComponent';

const logger = appComponent.get<Logger>();

window.logger = logger;
window.platformDelegate = platformDelegate;
window.onerror = (message, url, line, col, error) => {
  const availableLogger = logger ?? console;
  availableLogger.error(
    JSON.stringify(message) + '\n',
    `Url: ${url}\n`,
    `Line: ${line}\n`,
    `Column: ${col}\n`,
    error,
  );
  alert(
    [
      'Sorry, Lyricistant has crashed! Please close this app and contact the developers.',
      'Continuing to use Lyricistant may result in undesired behavior.',
      '',
      `App version: ${process.env.APP_VERSION}`,
      `Homepage: ${process.env.APP_HOMEPAGE}`,
    ].join('\n'),
  );
};
window.onunhandledrejection = (event) => window.onerror(event.reason);

new Promise<void>((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(async () => {
    logger.info('Platform information', {
      appPlatform: 'Mobile',
      version:
        (await import('@lyricistant/renderer/globals')).APP_VERSION ?? 'Error',
      userAgent: navigator.userAgent,
    });
  })
  .then(() => import('@lyricistant/renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
