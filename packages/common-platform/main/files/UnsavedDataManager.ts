import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { TemporaryFiles } from '@lyricistant/common-platform/files/TemporaryFiles';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import {
  Manager,
  withDialogSupport,
} from '@lyricistant/common-platform/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { YES_NO_BUTTONS } from '@lyricistant/common/dialogs/Dialog';
import { Logger } from '@lyricistant/common/Logger';

export class UnsavedDataManager implements Manager {
  public static readonly UNSAVED_LYRICS_KEY = 'unsaved-lyrics-key';
  private static readonly RECOVER_UNSAVED_LYRICS_TAG =
    'unsaved-data-manager-recover-lyrics';

  public constructor(
    private rendererDelegate: RendererDelegate,
    private fileManager: FileManager,
    private temporaryFiles: TemporaryFiles,
    private fileHistory: FileHistory,
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
    const hasTemporaryData = await this.temporaryFiles.exists(
      UnsavedDataManager.UNSAVED_LYRICS_KEY
    );
    const hasUnsavedData =
      hasTemporaryData &&
      this.fileHistory.isNonEmptyHistory(
        JSON.parse(
          await this.temporaryFiles.get(UnsavedDataManager.UNSAVED_LYRICS_KEY)
        )
      );

    if (hasUnsavedData) {
      this.logger.verbose('Unsaved data found.');
      this.rendererDelegate.send('show-dialog', {
        type: 'alert',
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
      this.temporaryFiles.delete(UnsavedDataManager.UNSAVED_LYRICS_KEY);
    });
  };

  private onDialogClicked = async (tag: string, buttonLabel: string) => {
    if (tag === UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG) {
      if (buttonLabel === 'Yes') {
        this.fileHistory.deserialize(
          JSON.parse(
            await this.temporaryFiles.get(UnsavedDataManager.UNSAVED_LYRICS_KEY)
          )
        );
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          this.fileHistory.getParsedHistory(),
          false
        );
      }
      this.startAutomaticFileSaver();
    }
  };

  private saveFile = () => {
    const onEditorText = async (text: string) => {
      this.rendererDelegate.removeListener('editor-text', onEditorText);
      this.fileHistory.add(text);

      await this.temporaryFiles.set(
        UnsavedDataManager.UNSAVED_LYRICS_KEY,
        JSON.stringify(this.fileHistory.serialize())
      );
      setTimeout(this.saveFile, 30000);
    };

    this.rendererDelegate.on('editor-text', onEditorText);
    this.rendererDelegate.send('request-editor-text');
  };
}
