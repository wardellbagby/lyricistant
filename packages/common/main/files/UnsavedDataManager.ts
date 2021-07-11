import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { Manager, withDialogSupport } from '@lyricistant/common/Manager';
import { YES_NO_BUTTONS } from '@lyricistant/common/dialogs/Dialog';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';

export class UnsavedDataManager implements Manager {
  private static readonly RECOVER_UNSAVED_LYRICS_TAG =
    'unsaved-data-manager-recover-lyrics';

  public constructor(
    private rendererDelegate: RendererDelegate,
    private fileManager: FileManager,
    private temporaryFiles: TemporaryFiles,
    private logger: Logger
  ) {
    withDialogSupport(
      this,
      rendererDelegate,
      this.onDialogClicked,
      UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG
    );
  }

  public register = (): void => {
    this.fileManager.setInitialFileLoadedListener(this.checkForUnsavedData);
  };

  private checkForUnsavedData = async () => {
    this.logger.verbose('Checking for unsaved data...');
    if (this.temporaryFiles.exists()) {
      this.logger.verbose('Unsaved data found.');
      this.rendererDelegate.send('show-dialog', {
        tag: UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
        title: 'Recover unsaved lyrics',
        message: 'Unsaved lyrics found. Would you like to recover them?',
        buttons: YES_NO_BUTTONS,
      });
    } else {
      this.startAutomaticFileSaver();
    }
  };

  private startAutomaticFileSaver = () => {
    setTimeout(this.saveFile, 5000);
    this.fileManager.addOnFileChangedListener(() => {
      this.temporaryFiles.delete();
    });
  };

  private onDialogClicked = async (tag: string, buttonLabel: string) => {
    if (tag === UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG) {
      if (buttonLabel === 'Yes') {
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          undefined,
          await this.temporaryFiles.get(),
          false
        );
      }
      this.startAutomaticFileSaver();
    }
  };

  private saveFile = () => {
    const onEditorText = async (text: string) => {
      this.rendererDelegate.removeListener('editor-text', onEditorText);

      if (text.length > 0) {
        this.logger.verbose('Saving current data to temporary file.');
        await this.temporaryFiles.set(text);
      } else {
        this.logger.verbose('No current data to temp save. Skipping.');
        await this.temporaryFiles.delete();
      }
      setTimeout(this.saveFile, 30000);
    };

    this.rendererDelegate.on('editor-text', onEditorText);
    this.rendererDelegate.send('request-editor-text');
  };
}
