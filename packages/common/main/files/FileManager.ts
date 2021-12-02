import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common/Manager';
import {
  DroppableFile,
  ExtensionData,
  Files,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import { RecentFiles } from '@lyricistant/common/files/RecentFiles';
import {
  FileHandler,
  FileHandlers,
} from '@lyricistant/common/files/handlers/FileHandler';
import { LyricistantFileHandler } from '@lyricistant/common/files/handlers/LyricistantFileHandler';
import { FileDataExtensions } from '@lyricistant/common/files/extensions/FileDataExtension';

const SAVE_FILE_DIALOG_TAG = 'save-file';
const OPEN_FILE_DIALOG_TAG = 'open-file';

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
    private fileDataExtensions: FileDataExtensions,
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
    this.rendererDelegate.send('show-dialog', {
      tag: OPEN_FILE_DIALOG_TAG,
      type: 'fullscreen',
      message: 'Opening file',
      progress: 'indeterminate',
    });

    try {
      if (filePath && this.files.readFile) {
        const platformFile = await this.files.readFile(filePath);
        await this.openFileActual(platformFile);
      } else {
        await this.onOpenFile();
      }
    } catch (e) {
      this.logger.error('Error opening file.', e);
      this.rendererDelegate.send('file-opened', e, undefined, undefined, true);
    } finally {
      this.rendererDelegate.send('close-dialog', OPEN_FILE_DIALOG_TAG);
    }
  };

  public saveFile = (forceSaveAs: boolean) => {
    this.rendererDelegate.send('show-dialog', {
      tag: SAVE_FILE_DIALOG_TAG,
      type: 'fullscreen',
      message: 'Saving file',
      progress: 'indeterminate',
    });
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
    this.rendererDelegate.send('show-dialog', {
      tag: OPEN_FILE_DIALOG_TAG,
      type: 'fullscreen',
      message: 'Opening file',
      progress: 'indeterminate',
    });

    try {
      const platformFile = await this.files.openFile(file);
      await this.openFileActual(platformFile);
    } catch (e) {
      this.logger.error('Error opening file.', e);
      this.rendererDelegate.send('file-opened', e, undefined, undefined, true);
    } finally {
      this.rendererDelegate.send('close-dialog', OPEN_FILE_DIALOG_TAG);
    }
  };

  private onSaveFile = async (text: string) => {
    this.rendererDelegate.send('show-dialog', {
      tag: SAVE_FILE_DIALOG_TAG,
      type: 'fullscreen',
      message: 'Saving file',
      progress: 'indeterminate',
    });
    await this.saveFileActual(text, this.currentFilePath);
  };

  private saveFileActual = async (lyrics: string, path: string) => {
    try {
      this.logger.debug('Saving file with lyrics', { path, lyrics });

      this.fileDataExtensions.forEach((extension) =>
        extension.onBeforeSerialization?.(lyrics)
      );
      const extensions = this.fileDataExtensions.reduce(
        (data: Partial<ExtensionData>, extension) => {
          data[extension.key] = JSON.stringify(extension.serialize());
          return data;
        },
        {}
      );
      const serializedFileData = await this.currentFileHandler.create({
        extensions,
        lyrics,
      });

      const newFileMetadata = await this.files.saveFile(
        serializedFileData,
        path
      );
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
    } catch (e) {
      this.logger.error('Error saving file', e);
    } finally {
      this.rendererDelegate.send('close-dialog', SAVE_FILE_DIALOG_TAG);
    }
  };

  private openFileActual = async (platformFile: PlatformFile) => {
    const { handler, fileData } = await this.createFileData(platformFile);

    this.currentFilePath = platformFile?.metadata?.path;
    this.currentFileHandler = handler;
    this.fileDataExtensions.forEach((extension) => {
      const data = fileData.extensions?.[extension.key];
      if (data?.length > 0) {
        extension.deserialize(JSON.parse(fileData.extensions?.[extension.key]));
      } else {
        extension.deserialize(null);
      }
    });
    this.rendererDelegate.send(
      'file-opened',
      undefined,
      platformFile.metadata.name ?? platformFile.metadata.path,
      fileData?.lyrics ?? '',
      true
    );
    this.addRecentFile(this.currentFilePath);
    const updatedRecentFiles = this.recentFiles.getRecentFiles();
    this.fileChangedListeners.forEach((listener) =>
      listener(
        platformFile.metadata.name ?? platformFile.metadata.path,
        updatedRecentFiles
      )
    );
  };

  private onOkayForNewFile = () => {
    this.currentFilePath = null;
    this.currentFileHandler = this.defaultFileHandler;
    this.rendererDelegate.send('new-file-created');
    this.fileDataExtensions.forEach((extension) => extension.deserialize(null));
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
