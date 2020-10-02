import { RendererDelegate } from 'common/Delegates';
import { Dialogs } from 'common/dialogs/Dialogs';
import { FileData, Files } from 'common/files/Files';
import { RecentFiles } from 'common/files/RecentFiles';
import { Manager } from 'common/Manager';

export class FileManager implements Manager {
  private currentFilePath: string | null = null;
  private fileChangedListeners: Array<
    (currentFilename: string | null, recentFiles: string[]) => void
  > = [];

  constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private recentFiles: RecentFiles,
    private dialogs: Dialogs
  ) {}

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('new-file-attempt', this.onNewFile);
    this.rendererDelegate.on('open-file-attempt', this.onOpenFile);
    this.rendererDelegate.on('save-file-attempt', this.onSaveFile);

    this.rendererDelegate.on('prompt-save-file-for-new', this.onPromptSaveFile);

    this.rendererDelegate.on('okay-for-new-file', this.onOkayForNewFile);
  }

  public addOnFileChangedListener = (
    listener: (currentFilename: string | null, recentFiles: string[]) => void
  ) => {
    this.fileChangedListeners.push(listener);
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
      this.addRecentFile(filePath);
      const updatedRecentFiles = this.recentFiles.getRecentFiles();
      this.fileChangedListeners.forEach((listener) =>
        listener(fileData.filePath, updatedRecentFiles)
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
    this.onOkayForNewFile();
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
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined);
      return;
    }
    this.addRecentFile(this.currentFilePath);
    this.fileChangedListeners.forEach((listener) =>
      listener(this.currentFilePath, this.recentFiles.getRecentFiles())
    );
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
    this.fileChangedListeners.forEach((listener) =>
      listener(null, this.recentFiles.getRecentFiles())
    );
  };

  private onPromptSaveFile = async () => {
    const result = await this.dialogs.showDialog(
      "Your changes haven't been saved. Are you sure you want to create a new file?"
    );

    if (result === 'yes') {
      this.onOkayForNewFile();
    }
  };

  private addRecentFile = (filePath: string) => {
    let recentlyOpenedFiles = this.recentFiles.getRecentFiles();
    recentlyOpenedFiles.unshift(filePath);
    recentlyOpenedFiles = Array.from(new Set(recentlyOpenedFiles));
    if (recentlyOpenedFiles.length > 10) {
      recentlyOpenedFiles.pop();
    }
    this.recentFiles.setRecentFiles(recentlyOpenedFiles);
  };
}
