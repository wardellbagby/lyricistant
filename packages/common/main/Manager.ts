import {
  PlatformToRendererListener,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';

/**
 * Represents some discrete "grouping" of logic related mostly to a single bit
 * of functionality that needs to be handled on the platform.
 *
 * Managers are the basic building block of all platform-related code. They
 * primarily handle communication between the platform and the renderer via
 * having a {@link RendererDelegate} injected via their constructors, and
 * registering for renderer events (or using
 * {@link RendererDelegate.addRendererListenerSetListener}) to respond to with
 * data.
 *
 * Some general tips:
 *
 * 1. Managers should avoid talking directly to other managers. Instead, inject
 * "platform" classes directly. Lyricistant doesn't currently hold this rule
 * true, but it's still a good tip to abide by.
 * 2. Prefer sending data immediately to the renderer as soon as the renderer
 * sets a listener for a channel, vs waiting for a specific event from the
 * renderer asking for data.
 * 3. Keep managers focused on a single feature. What feature means is loosely
 * defined but if you're listening to more than 4 renderer channels, your
 * manager is likely doing too much work.
 */
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
