import { RendererDelegate } from '../Delegates';
import { Dialogs } from '../dialogs/Dialogs';
import { Logger } from '../Logger';
import { Manager } from '../Manager';
import { DroppableFile, Files } from './Files';
import { RecentFiles } from './RecentFiles';

export class FileManager implements Manager {
  private currentFilePath: string | null = null;
  private fileChangedListeners: Array<
    (currentFilename: string | null, recentFiles: string[]) => void
  > = [];
  private initialFileLoadedListener: () => void = undefined;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private recentFiles: RecentFiles,
    private dialogs: Dialogs,
    private logger: Logger
  ) {}

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('new-file-attempt', this.onNewFile);
    this.rendererDelegate.on('open-file-attempt', this.onOpenFile);
    this.rendererDelegate.on('save-file-attempt', this.onSaveFile);

    this.rendererDelegate.on('prompt-save-file-for-new', this.onPromptSaveFile);
    this.rendererDelegate.on(
      'prompt-save-file-for-open',
      this.onPromptSaveFileForOpen
    );

    this.rendererDelegate.on('okay-for-new-file', this.onOkayForNewFile);
  }

  public addOnFileChangedListener = (
    listener: (currentFilename: string | null, recentFiles: string[]) => void
  ) => {
    this.fileChangedListeners.push(listener);
  };

  public setInitialFileLoadedListener = (listener: () => void) => {
    this.initialFileLoadedListener = listener;
  };

  public onNewFile = () => {
    this.rendererDelegate.send('is-okay-for-new-file');
  };

  public openFile = async (filePath?: string) => {
    if (filePath && this.files.readFile) {
      const fileData = await this.files.readFile(filePath);
      this.currentFilePath = fileData.path;
      this.rendererDelegate.send(
        'file-opened',
        undefined,
        fileData.name ?? fileData.path,
        fileData.data,
        true
      );
      this.addRecentFile(filePath);
      const updatedRecentFiles = this.recentFiles.getRecentFiles();
      this.fileChangedListeners.forEach((listener) =>
        listener(fileData.path, updatedRecentFiles)
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
    this.initialFileLoadedListener?.();
  };

  private onOpenFile = async (file?: DroppableFile) => {
    try {
      const fileData = await this.files.openFile(file);
      if (fileData) {
        this.currentFilePath = fileData.path;
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          fileData.name ?? fileData.path,
          fileData.data,
          true
        );
        this.addRecentFile(this.currentFilePath);
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined, true);
      return;
    }
    this.fileChangedListeners.forEach((listener) =>
      listener(this.currentFilePath, this.recentFiles.getRecentFiles())
    );
  };

  private onSaveFile = async (text: string) => {
    await this.saveFileActual(text, this.currentFilePath);
  };

  private saveFileActual = async (data: string, path: string) => {
    this.logger.debug('Saving file with data', { path, data });
    const newFileMetadata = await this.files.saveFile(data, path);
    if (newFileMetadata) {
      const fileTitle = newFileMetadata.name ?? newFileMetadata.path;
      this.currentFilePath = newFileMetadata.path;
      this.rendererDelegate.send(
        'file-opened',
        undefined,
        fileTitle,
        data,
        true
      );
      this.addRecentFile(newFileMetadata.path);
      this.rendererDelegate.send('file-save-ended', null, fileTitle);
    } else {
      this.rendererDelegate.send('file-save-ended', null, null);
    }
    this.fileChangedListeners.forEach((listener) =>
      listener(this.currentFilePath, this.recentFiles.getRecentFiles())
    );
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
    } else {
      this.logger.debug('User selected to not create a new file.');
    }
  };

  private onPromptSaveFileForOpen = async (file: DroppableFile) => {
    const result = await this.dialogs.showDialog(
      "Your changes haven't been saved. Are you sure you want to open this file?"
    );

    if (result === 'yes') {
      await this.onOpenFile(file);
    } else {
      this.logger.debug('User selected to not open file', file.path);
    }
  };

  private addRecentFile = (filePath: string) => {
    this.logger.debug('Attempting to add recent file', filePath);
    let recentlyOpenedFiles = this.recentFiles.getRecentFiles();
    recentlyOpenedFiles.unshift(filePath);
    recentlyOpenedFiles = Array.from(new Set(recentlyOpenedFiles));
    if (recentlyOpenedFiles.length > 10) {
      recentlyOpenedFiles.pop();
    }
    this.recentFiles.setRecentFiles(recentlyOpenedFiles);
  };
}
