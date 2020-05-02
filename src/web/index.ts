import { Manager } from 'common/Manager';
import { PreferenceManager } from 'common/preferences/PreferenceManager';
import { rendererDelegate } from './Delegates';

const managers: Manager[] = [new PreferenceManager(rendererDelegate)];
export const onRendererStarted = (): void => {
  managers.forEach((manager) => manager.register());
};
