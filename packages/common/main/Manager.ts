import {
  PlatformToRendererListener,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';

export interface Manager {
  register(): void;
}

export const showPlatformDialog = async (
  rendererDelegate: RendererDelegate,
  ...args: Parameters<PlatformToRendererListener['show-dialog']>
): Promise<Parameters<RendererToPlatformListener['dialog-button-clicked']>> =>
  new Promise((resolve) => {
    const listener = (
      ...clickArgs: Parameters<
        RendererToPlatformListener['dialog-button-clicked']
      >
    ) => {
      rendererDelegate.removeListener('dialog-button-clicked', listener);
      resolve(clickArgs);
    };
    const onCloseListener = () => {
      rendererDelegate.removeListener('dialog-button-clicked', listener);
      rendererDelegate.removeListener('dialog-closed', onCloseListener);
    };
    rendererDelegate.on('dialog-button-clicked', listener);
    rendererDelegate.on('dialog-closed', onCloseListener);
    rendererDelegate.send('show-dialog', ...args);
  });

export const withDialogSupport = (
  manager: Manager,
  rendererDelegate: RendererDelegate,
  onDialogClicked: (tag: string, buttonLabel: string) => void,
  ...tags: string[]
) => {
  const register = manager.register;
  manager.register = () => {
    register();
    rendererDelegate.on('dialog-button-clicked', (dialogTag, buttonLabel) => {
      if (tags.indexOf(dialogTag) >= 0) {
        onDialogClicked(dialogTag, buttonLabel);
      }
    });
  };
};
