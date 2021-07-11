import { RendererDelegate } from "@lyricistant/common/Delegates";

export interface Manager {
  register(): void;
}

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
