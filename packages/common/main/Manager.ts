import {
  PlatformToRendererListener,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';

export interface Manager {
  register(): void;
}

/**
 * Show a dialog on the renderer and wait for the dialog to be interacted with.
 *
 * If your dialog can't be interacted with (you don't supply any buttons to it),
 * then this will never resolve. You should instead just use
 * `rendererDelegate.send('show-dialog')` directly.
 */
export const showRendererDialog = async (
  rendererDelegate: RendererDelegate,
  ...args: Parameters<PlatformToRendererListener['show-dialog']>
): Promise<Parameters<RendererToPlatformListener['dialog-interaction']>> =>
  new Promise((resolve) => {
    const listener = (
      ...clickArgs: Parameters<RendererToPlatformListener['dialog-interaction']>
    ) => {
      rendererDelegate.removeListener('dialog-interaction', listener);
      resolve(clickArgs);
    };
    const onCloseListener = () => {
      rendererDelegate.removeListener('dialog-interaction', listener);
      rendererDelegate.removeListener('dialog-closed', onCloseListener);
    };
    rendererDelegate.on('dialog-interaction', listener);
    rendererDelegate.on('dialog-closed', onCloseListener);
    rendererDelegate.send('show-dialog', ...args);
  });

/**
 * @deprecated Use showRendererDialog instead
 */
export const withDialogSupport = (
  manager: Manager,
  rendererDelegate: RendererDelegate,
  onDialogClicked: (tag: string, buttonLabel: string) => void,
  ...tags: string[]
) => {
  const register = manager.register;
  manager.register = () => {
    register();
    rendererDelegate.on('dialog-interaction', (dialogTag, interactionData) => {
      if (tags.indexOf(dialogTag) >= 0) {
        onDialogClicked(dialogTag, interactionData.selectedButton);
      }
    });
  };
};
