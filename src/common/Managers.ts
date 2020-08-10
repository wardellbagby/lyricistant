import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { PreferenceManager } from 'common/preferences/PreferenceManager';

export const registerCommonManagers = (
  rendererDelegate: RendererDelegate
): void => {
  [
    new PreferenceManager(rendererDelegate),
    new FileManager(rendererDelegate)
  ].forEach((manager) => manager.register());
};
