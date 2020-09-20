import { Manager } from 'common/Manager';
import { Dialogs } from 'platform/Dialogs';
import { mainWindow } from '../index';

export class QuitManager extends Manager {
  private readonly dialogs = new Dialogs();

  public register(): void {
    this.rendererDelegate.on('okay-for-quit', this.onOkayForQuit);
    this.rendererDelegate.on('prompt-save-file-for-quit', this.onPromptQuit);
  }

  public attemptQuit() {
    this.rendererDelegate.send('is-okay-for-quit-file');
  }

  private onOkayForQuit = () => {
    mainWindow.destroy();
  };

  private onPromptQuit = async () => {
    const result = await this.dialogs.showDialog(
      "Are you sure you want to quit? Your changes haven't been saved."
    );

    if (result === 'yes') {
      this.onOkayForQuit();
    }
  };
}
