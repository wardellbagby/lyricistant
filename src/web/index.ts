import { PreferenceManager } from 'common/managers/PreferenceManager';
import { rendererDelegate } from './Delegate';

export const onRendererStarted = (): void => {
  new PreferenceManager(rendererDelegate).register();
};
