import { Manager } from 'common/Manager';
import { PreferenceManager } from 'common/preferences/PreferenceManager';
import { rendererDelegate } from './Delegates';

const managers: Manager[] = [new PreferenceManager(rendererDelegate)];
const registerManagers = (): void => {
  managers.forEach((manager) => manager.register());
};

new Promise((resolve) => resolve(registerManagers()))
  .then(() => import('../renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
