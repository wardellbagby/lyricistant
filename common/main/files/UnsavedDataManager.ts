import { RendererDelegate } from '../Delegates';
import { Dialogs } from '../dialogs/Dialogs';
import { Logger } from '../Logger';
import { Manager } from '../Manager';
import { FileManager } from './FileManager';
import { TemporaryFiles } from './TemporaryFiles';

export class UnsavedDataManager implements Manager {
  constructor(
    private rendererDelegate: RendererDelegate,
    private fileManager: FileManager,
    private temporaryFiles: TemporaryFiles,
    private dialogs: Dialogs,
    private logger: Logger
  ) {}

  public register(): void {
    this.fileManager.setInitialFileLoadedListener(this.checkForUnsavedData);
  }

  private checkForUnsavedData = async () => {
    this.logger.verbose('Checking for unsaved data...');
    if (this.temporaryFiles.exists()) {
      this.logger.verbose('Unsaved data found.');
      const unsavedData = await this.temporaryFiles.get();
      const result = await this.dialogs.showDialog(
        'Unsaved lyrics found. Would you like to recover them?'
      );
      if (result === 'yes') {
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          undefined,
          unsavedData,
          false
        );
      }
    }
    setTimeout(this.saveFile, 5000);
    this.fileManager.addOnFileChangedListener(() => {
      this.temporaryFiles.delete();
    });
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
