import { setTimeout } from 'timers';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common/Manager';
import { BrowserWindow } from 'electron';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';

export class QuitManager implements Manager {
  private forceQuitTimeout?: NodeJS.Timeout;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private dialogs: Dialogs,
    private temporaryFiles: TemporaryFiles,
    private logger: Logger,
    private window: BrowserWindow
  ) {}

  public register = (): void => undefined;

  public attemptQuit() {
    const isFileModified = async (modified: boolean) => {
      this.rendererDelegate.removeListener('is-file-modified', isFileModified);
      if (modified) {
        await this.onPromptQuit();
      } else {
        this.onOkayForQuit();
      }
    };

    this.rendererDelegate.on('is-file-modified', isFileModified);
    this.rendererDelegate.send('check-file-modified');
    this.forceQuitTimeout = setTimeout(() => {
      this.logger.error(
        'Force-closing app because renderer never responded and user attempted quit!'
      );
      this.window.destroy();
    }, 2500);
  }

  private onOkayForQuit = () => {
    clearTimeout(this.forceQuitTimeout);
    this.temporaryFiles.delete(UnsavedDataManager.UNSAVED_LYRICS_KEY);
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
