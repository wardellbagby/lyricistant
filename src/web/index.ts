import { registerCommonManagers } from 'common/Managers';
import { rendererDelegate } from './Delegates';

new Promise((resolve) => resolve(registerCommonManagers(rendererDelegate)))
  .then(() => import('../renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
