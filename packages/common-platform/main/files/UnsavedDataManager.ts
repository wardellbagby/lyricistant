import { RendererDelegate } from '@lyricistant/common/Delegates';
import { YES_NO_BUTTONS } from '@lyricistant/common/dialogs/Dialog';
import { Logger } from '@lyricistant/common/Logger';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import {
  Manager,
  showRendererDialog,
} from '@lyricistant/common-platform/Manager';
import { Times } from '@lyricistant/common-platform/time/Times';
import { Serializable } from '@lyricistant/common/Serializable';

export class UnsavedDataManager implements Manager {
  public static readonly UNSAVED_LYRICS_KEY = 'unsaved-lyrics-key';
  public static readonly RECOVER_UNSAVED_LYRICS_TAG =
    'unsaved-data-manager-recover-lyrics';
  private static readonly MINIMUM_FILE_SAVE_ELAPSED_TIME_MS = 30_000;
  private static readonly AUTOMATIC_FILE_SAVE_MS = 300_000;

  private lastFileSaveMs: number = null;
  private hasPromptedUnsavedDataRecovery = false;
  public constructor(
    private rendererDelegate: RendererDelegate,
    private fileManager: FileManager,
    private appData: AppData,
    private fileHistory: FileHistory,
    private times: Times,
    private logger: Logger,
  ) {}

  public register = (): void => {
    this.fileManager.setInitialFileLoadedListener(this.checkForUnsavedData);
    this.rendererDelegate.on('editor-idle', this.onEditorIdle);
    this.fileManager.addOnFileChangedListener(() => {
      if (this.hasPromptedUnsavedDataRecovery) {
        this.appData.delete(UnsavedDataManager.UNSAVED_LYRICS_KEY);
      }
    });
  };

  private checkForUnsavedData = async () => {
    this.logger.verbose('Checking for unsaved data...');
    const hasTemporaryData = await this.appData.exists(
      UnsavedDataManager.UNSAVED_LYRICS_KEY,
    );
    const hasUnsavedData =
      hasTemporaryData &&
      (await this.fileHistory.isNonEmptyHistory(await this.getUnsavedData()));

    if (hasUnsavedData) {
      this.logger.verbose('Unsaved data found.');
      const interactionData = await showRendererDialog(this.rendererDelegate, {
        type: 'alert',
        tag: UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
        title: 'Recover unsaved lyrics',
        message: 'Unsaved lyrics found. Would you like to recover them?',
        buttons: YES_NO_BUTTONS,
      });
      await this.onDialogClicked(
        UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
        interactionData.selectedButton,
      );
    } else {
      this.hasPromptedUnsavedDataRecovery = true;
      this.startAutomaticFileSaver();
    }
  };

  private onDialogClicked = async (tag: string, buttonLabel: string) => {
    if (tag === UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG) {
      if (buttonLabel === 'Yes') {
        await this.fileHistory.deserialize(await this.getUnsavedData());
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          this.fileHistory.getParsedHistory(),
          false,
        );
      }
      this.hasPromptedUnsavedDataRecovery = true;
      this.startAutomaticFileSaver();
    }
  };

  private onEditorIdle = async (text: string) => {
    if (this.canPerformFileSave()) {
      this.logger.verbose('Editor is idle; saving unsaved data');
      await this.performFileSave(text);
    } else {
      this.logger.verbose(
        'Editor is idle but unsaved data save was too recent. Skipping.',
      );
    }
  };

  private startAutomaticFileSaver = () => {
    setTimeout(
      this.onAutomaticFileSaveTriggered,
      UnsavedDataManager.AUTOMATIC_FILE_SAVE_MS,
    );
  };

  private onAutomaticFileSaveTriggered = () => {
    const onEditorText = async (text: string) => {
      this.rendererDelegate.removeListener('editor-text', onEditorText);
      await this.performFileSave(text);

      setTimeout(
        this.onAutomaticFileSaveTriggered,
        UnsavedDataManager.AUTOMATIC_FILE_SAVE_MS,
      );
    };

    this.rendererDelegate.on('editor-text', onEditorText);
    this.rendererDelegate.send('request-editor-text');
  };

  private performFileSave = async (text: string) => {
    this.fileHistory.add(text);
    this.appData.set(
      UnsavedDataManager.UNSAVED_LYRICS_KEY,
      await this.fileHistory.serialize(),
    );
    this.lastFileSaveMs = this.times.elapsed();
  };

  private canPerformFileSave = () =>
    this.hasPromptedUnsavedDataRecovery ||
    this.lastFileSaveMs == null ||
    this.times.elapsed() - this.lastFileSaveMs >=
      UnsavedDataManager.MINIMUM_FILE_SAVE_ELAPSED_TIME_MS;

  private getUnsavedData = (): Promise<Serializable> =>
    this.appData.get(UnsavedDataManager.UNSAVED_LYRICS_KEY);
}
