import { PreferenceManager } from 'common/preferences/PreferenceManager';
import { rendererDelegate } from './Delegates';

export const onRendererStarted = (): void => {
  new PreferenceManager(rendererDelegate).register();
};
