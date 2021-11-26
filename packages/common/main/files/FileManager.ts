import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common/Manager';
import {
  DroppableFile,
  Files,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import {
  FileHandler,
  FileHandlers,
} from '@lyricistant/common/files/handlers/FileHandler';
import { LyricistantFileHandler } from '@lyricistant/common/files/handlers/LyricistantFileHandler';

export class FileManager implements Manager {
  private currentFilePath: string | null = null;
  private currentFileHandler: FileHandler = this.defaultFileHandler;
  private fileChangedListeners: Array<
    (currentFilename: string | null, recentFiles: string[]) => void
  > = [];
  private initialFileLoadedListener: () => void = undefined;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private recentFiles: RecentFiles,
    private dialogs: Dialogs,
    private fileHandlers: FileHandlers,
    private defaultFileHandler: LyricistantFileHandler,
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
      const platformFile = await this.files.readFile(filePath);

      const { handler, fileData } = await this.createFileData(platformFile);

      this.currentFilePath = platformFile?.metadata?.path;
      this.currentFileHandler = handler;
      this.rendererDelegate.send(
        'file-opened',
        undefined,
        platformFile.metadata.name ?? platformFile.metadata.path,
        fileData?.lyrics ?? '',
        true
      );
      this.addRecentFile(filePath);
      const updatedRecentFiles = this.recentFiles.getRecentFiles();
      this.fileChangedListeners.forEach((listener) =>
        listener(
          platformFile.metadata.name ?? platformFile.metadata.path,
          updatedRecentFiles
        )
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
      const platformFile = await this.files.openFile(file);

      const { handler, fileData } = await this.createFileData(platformFile);

      if (fileData) {
        this.currentFilePath = platformFile.metadata.path;
        this.currentFileHandler = handler;
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          platformFile.metadata.name ?? platformFile.metadata.path,
          fileData.lyrics,
          true
        );
        this.addRecentFile(this.currentFilePath);
        this.fileChangedListeners.forEach((listener) =>
          listener(
            platformFile.metadata.name ?? platformFile.metadata.path,
            this.recentFiles.getRecentFiles()
          )
        );
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined, true);
      return;
    }
  };

  private onSaveFile = async (text: string) => {
    await this.saveFileActual(text, this.currentFilePath);
  };

  private saveFileActual = async (lyrics: string, path: string) => {
    this.logger.debug('Saving file with lyrics', { path, lyrics });
    const saveFileData = await this.currentFileHandler.create({ lyrics });

    const newFileMetadata = await this.files.saveFile(saveFileData, path);
    if (newFileMetadata) {
      const fileTitle = newFileMetadata.name ?? newFileMetadata.path;
      this.currentFilePath = newFileMetadata.path;
      this.rendererDelegate.send(
        'file-opened',
        undefined,
        fileTitle,
        lyrics,
        true
      );
      this.addRecentFile(newFileMetadata.path);
      this.fileChangedListeners.forEach((listener) =>
        listener(fileTitle, this.recentFiles.getRecentFiles())
      );
      this.rendererDelegate.send('file-save-ended', null, fileTitle);
    } else {
      this.rendererDelegate.send('file-save-ended', null, null);
    }
  };

  private onOkayForNewFile = () => {
    this.currentFilePath = null;
    this.currentFileHandler = this.defaultFileHandler;
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

  private createFileData = async (file: PlatformFile) => {
    const handler = this.fileHandlers.find((it) => it().canHandle(file))?.();
    return {
      handler,
      fileData: await handler?.load(file),
    };
  };
}
