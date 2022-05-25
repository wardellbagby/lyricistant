import { setTimeout } from 'timers';
import { AppData } from '@lyricistant/common-platform/files/AppData';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import {
  Manager,
  showRendererDialog,
} from '@lyricistant/common-platform/Manager';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { BrowserWindow } from 'electron';

const PROMPT_QUIT_TAG = 'prompt-quit';
export class QuitManager implements Manager {
  private forceQuitTimeout?: NodeJS.Timeout;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private appData: AppData,
    private logger: Logger,
    private window: BrowserWindow
  ) {}

  public register = (): void => undefined;

  public attemptQuit() {
    if (isUnderTest) {
      this.onOkayForQuit();
      return;
    }

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
    this.appData.delete(UnsavedDataManager.UNSAVED_LYRICS_KEY);
    this.window.destroy();
  };

  private onPromptQuit = async () => {
    clearTimeout(this.forceQuitTimeout);
    const [tag, { selectedButton }] = await showRendererDialog(
      this.rendererDelegate,
      {
        tag: PROMPT_QUIT_TAG,
        type: 'alert',
        title: 'Discard unsaved changes?',
        message:
          "Are you sure you want to quit? Your changes haven't been saved.",
        buttons: ['No', 'Quit Lyricistant'],
      }
    );

    if (tag === PROMPT_QUIT_TAG) {
      if (selectedButton === 'Quit Lyricistant') {
        this.onOkayForQuit();
      }
    }
  };
}
