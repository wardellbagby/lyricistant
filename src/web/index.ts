import { registerCommonManagers } from 'common/Managers';
import { rendererDelegate } from './Delegates';

new Promise((resolve) => resolve(registerCommonManagers(rendererDelegate)))
  .then(() => {
    rendererDelegate.on('ready-for-events', () => {
      rendererDelegate.send('ui-config', { showDownload: true });
    });
  })
  .then(() => import('../renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
