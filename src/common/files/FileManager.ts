import { FileData } from 'common/files/Files';
import { Manager } from 'common/Manager';
import { Dialogs } from 'platform/Dialogs';
import { Files } from 'platform/Files';
import { RecentFiles } from 'platform/RecentFiles';

export class FileManager extends Manager {
  private readonly files: Files = new Files();
  private readonly recentFiles = new RecentFiles();
  private readonly dialogs = new Dialogs();

  private currentFilePath: string | undefined = undefined;
  private newFileListener: (recentFiles: string[]) => void = undefined;

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('new-file-attempt', this.onNewFile);
    this.rendererDelegate.on('open-file-attempt', this.onOpenFile);
    this.rendererDelegate.on('save-file-attempt', this.onSaveFile);

    this.rendererDelegate.on('prompt-save-file-for-new', this.onPromptSaveFile);

    this.rendererDelegate.on('okay-for-new-file', this.onOkayForNewFile);
  }

  public onNewFileOpened = (listener: (recentFiles: string[]) => void) => {
    this.newFileListener = listener;
  };

  public onNewFile = () => {
    this.rendererDelegate.send('is-okay-for-new-file');
  };

  public openFile = async (filePath?: string) => {
    if (filePath && this.files.readFile) {
      const fileData = await this.files.readFile(filePath);
      this.currentFilePath = fileData.filePath;
      this.rendererDelegate.send(
        'file-opened',
        undefined,
        fileData.filePath,
        fileData.data
      );
    } else {
      await this.onOpenFile();
    }
  };

  public saveFile = (forceSaveAs: boolean) => {
    const onEditorText = async (text: string) => {
      this.rendererDelegate.removeListener('editor-text', onEditorText);

      let filePath = this.currentFilePath;
      if (forceSaveAs) {
        filePath = null;
      }

      await this.saveFileActual(text, filePath);
    };

    this.rendererDelegate.on('editor-text', onEditorText);
    this.rendererDelegate.send('request-editor-text');
  };

  private onRendererReady = () => {
    this.rendererDelegate.send('new-file-created');
    if (this.newFileListener) {
      this.newFileListener(this.recentFiles.getRecentFiles());
    }
  };

  private onOpenFile = async () => {
    try {
      const fileData = await this.files.openFile();
      if (fileData) {
        this.currentFilePath = fileData.filePath;
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          fileData.filePath,
          fileData.data
        );
        this.recentFiles.addRecentFile(this.currentFilePath);
        if (this.newFileListener) {
          this.newFileListener(this.recentFiles.getRecentFiles());
        }
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined);
    }
  };

  private onSaveFile = async (text: string) => {
    await this.saveFileActual(text, this.currentFilePath);
  };

  private saveFileActual = async (text: string, filePath: string) => {
    const newFilePath = await this.files.saveFile(new FileData(filePath, text));
    if (newFilePath) {
      this.currentFilePath = newFilePath;
      this.rendererDelegate.send('file-opened', undefined, newFilePath, text);
    }
    this.rendererDelegate.send('file-save-ended', null, this.currentFilePath);
  };

  private onOkayForNewFile = () => {
    this.currentFilePath = null;
    this.rendererDelegate.send('new-file-created');
  };

  private onPromptSaveFile = async () => {
    const result = await this.dialogs.showDialog(
      "Your changes haven't been saved. Are you sure you want to create a new file?"
    );

    if (result === 'yes') {
      this.onOkayForNewFile();
    }
  };
}
