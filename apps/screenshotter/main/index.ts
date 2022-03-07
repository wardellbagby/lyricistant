import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { Managers } from '@lyricistant/common-platform/Managers';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { platformDelegate } from '@lyricistant/core-dom-platform/Delegates';
import { appComponent } from '@screenshotter-app/AppComponent';

if (module.hot) {
  module.hot.accept();
}

const logger = appComponent.get<Logger>();

window.logger = logger;
window.platformDelegate = platformDelegate;

declare global {
  interface Window {
    rendererDelegate: RendererDelegate;
    fileHistory: FileHistory;
  }
}
window.rendererDelegate = appComponent.get<RendererDelegate>();
window.fileHistory = appComponent.get<FileHistory>();

new Promise<void>((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(async () => {
    logger.info('Platform information', {
      appPlatform: 'Screenshotter',
      version:
        (await import('@lyricistant/renderer/globals')).APP_VERSION ?? 'Error',
      userAgent: navigator.userAgent,
    });
  })
  .then(() => import('@lyricistant/renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
