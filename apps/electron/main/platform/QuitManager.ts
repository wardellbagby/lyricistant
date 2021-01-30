import { setTimeout } from 'timers';
import { RendererDelegate } from '@common/Delegates';
import { Dialogs } from '@common/dialogs/Dialogs';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { Logger } from '@common/Logger';
import { Manager } from '@common/Manager';
import { BrowserWindow } from 'electron';

export class QuitManager implements Manager {
  private forceQuitTimeout?: NodeJS.Timeout;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private dialogs: Dialogs,
    private temporaryFiles: TemporaryFiles,
    private logger: Logger,
    private window: BrowserWindow
  ) {}

  public register(): void {
    this.rendererDelegate.on('okay-for-quit', this.onOkayForQuit);
    this.rendererDelegate.on('prompt-save-file-for-quit', this.onPromptQuit);
  }

  public attemptQuit() {
    this.rendererDelegate.send('is-okay-for-quit-file');
    this.forceQuitTimeout = setTimeout(() => {
      this.logger.error(
        'Force-closing app because renderer never responded and user attempted quit!'
      );
      this.window.destroy();
    }, 2500);
  }

  private onOkayForQuit = () => {
    clearTimeout(this.forceQuitTimeout);
    this.temporaryFiles.delete();
    this.window.destroy();
  };

  private onPromptQuit = async () => {
    clearTimeout(this.forceQuitTimeout);
    const result = await this.dialogs.showDialog(
      "Are you sure you want to quit? Your changes haven't been saved."
    );

    if (result === 'yes') {
      this.onOkayForQuit();
    }
  };
}
