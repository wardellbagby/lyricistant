import {
  CancelError,
  Cancellable,
  CancelSignal,
  makeCancellable,
} from '@lyricistant/common/Cancellable';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { Logger } from '@lyricistant/common/Logger';
import { DefaultFileType } from '@lyricistant/common/preferences/PreferencesData';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import { FileDataExtensions } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import {
  Files,
  SerializedExtensions,
} from '@lyricistant/common-platform/files/Files';
import {
  FileHandler,
  FileHandlers,
} from '@lyricistant/common-platform/files/handlers/FileHandler';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import {
  Manager,
  showRendererDialog,
} from '@lyricistant/common-platform/Manager';
import {
  getPreferencesDataOrDefault,
  Preferences,
} from '@lyricistant/common-platform/preferences/Preferences';

/** Represents all the data that {@link FileManager} needs to store for the current file. */
interface CurrentFile {
  path: string;
  handler: FileHandler;
}

export class FileManager implements Manager {
  public static SAVE_FILE_DIALOG_TAG = 'save-file';
  public static OPEN_FILE_DIALOG_TAG = 'open-file';
  public static CONFIRM_NEW_FILE_TAG = 'confirm-new-file';
  public static CONFIRM_OPEN_FILE_TAG = 'confirm-open-file';
  public static CHOOSE_FILE_HANDLER_TAG = 'choose-file-handler';
  public static PROMPT_FILE_NAME_TAG = 'file-name-dialog';

  public initialFile: PlatformFile | null = null;

  private currentFile: CurrentFile | null = null;
  private fileChangedListeners: Array<
    (currentFilename: string | null, recentFiles: string[]) => void
  > = [];
  private initialFileLoadedListener: () => void = undefined;
  private isRendererReady = false;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private files: Files,
    private buffers: Buffers,
    private recentFiles: RecentFiles,
    private fileHandlers: FileHandlers,
    private fileDataExtensions: FileDataExtensions,
    private preferences: Preferences,
    private logger: Logger,
  ) {}

  private static generateDefaultFileName = (fileHandler: FileHandler) =>
    `Lyrics.${fileHandler.extension}`;

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('new-file-attempt', this.onNewFile);
    this.rendererDelegate.on('open-file-attempt', this.onOpenFile);
    this.rendererDelegate.on('save-file-attempt', this.onRendererSaveFile);
  }

  public addOnFileChangedListener = (
    listener: (currentFilename: string | null, recentFiles: string[]) => void,
  ) => {
    this.fileChangedListeners.push(listener);
  };

  public setInitialFileLoadedListener = (listener: () => void) => {
    this.initialFileLoadedListener = listener;
  };

  public onNewFile = () => {
    const isFileModified = async (modified: boolean) => {
      this.rendererDelegate.removeListener('is-file-modified', isFileModified);
      if (modified) {
        await this.onPromptSaveFileForNew();
      } else {
        this.createNewFile();
      }
    };

    this.rendererDelegate.on('is-file-modified', isFileModified);
    this.rendererDelegate.send('check-file-modified');
  };

  public onOpenFile = async (file?: PlatformFile) => {
    if (!this.isRendererReady && file) {
      this.logger.verbose(
        'Received a file before renderer ready; delaying open',
        file.metadata,
      );
      this.initialFile = file;
      return;
    }

    const isFileModified = async (modified: boolean) => {
      this.rendererDelegate.removeListener('is-file-modified', isFileModified);
      if (modified) {
        await this.onPromptSaveFileForOpen(file);
      } else {
        await this.openFile(file);
      }
    };

    this.rendererDelegate.on('is-file-modified', isFileModified);
    this.rendererDelegate.send('check-file-modified');
  };

  public onSaveFile = (forceSaveAs: boolean) => {
    this.showLoadingDialog('save');
    const onEditorText = async (text: string) => {
      this.rendererDelegate.removeListener('editor-text', onEditorText);

      let filePath = this.currentFile?.path;
      if (forceSaveAs) {
        filePath = null;
      }

      await this.saveFileActual(text, filePath);
    };

    this.rendererDelegate.on('editor-text', onEditorText);
    this.rendererDelegate.send('request-editor-text');
  };

  private openFile = async (file?: PlatformFile) => {
    const cancelSignal = this.showLoadingDialog('open', true);

    try {
      // We still pass this to the Files in-case they have state they want to set based on the PlatformFile, or if they
      // need to make any platform-specific changes before we open it.
      const platformFile = await makeCancellable(
        this.files.openFile(file),
        cancelSignal,
      );
      if (platformFile) {
        await this.openFileActual(platformFile);
      }
    } catch (e) {
      if (!(e instanceof CancelError)) {
        this.logger.error('Error opening file.', e);
      }
      this.rendererDelegate.send('file-opened', e, undefined, true);
    } finally {
      this.rendererDelegate.send(
        'close-dialog',
        FileManager.OPEN_FILE_DIALOG_TAG,
      );
    }
  };

  private onRendererReady = async () => {
    this.isRendererReady = true;
    this.createNewFile();

    if (this.initialFile) {
      this.logger.verbose(
        'Renderer ready; opening delayed file',
        this.initialFile.metadata,
      );
      await this.onOpenFile(this.initialFile);
      this.initialFile = null;
    }

    this.initialFileLoadedListener?.();
  };

  private onRendererSaveFile = async (text: string) => {
    this.showLoadingDialog('save');
    await this.saveFileActual(text, this.currentFile?.path);
  };

  private getUserSelectedFileName = async (
    fileHandler: FileHandler,
  ): Promise<string | null> => {
    const defaultFileName = FileManager.generateDefaultFileName(fileHandler);
    const interactionData = await showRendererDialog(this.rendererDelegate, {
      tag: FileManager.PROMPT_FILE_NAME_TAG,
      type: 'alert',
      title: 'Enter a file name',
      textField: {
        label: 'File name',
        defaultValue: defaultFileName,
        validationRegex: /^[\w.()_\-+]+$/.source,
      },
      buttons: ['Cancel', 'Save'],
    });

    if (interactionData.selectedButton === 'Cancel') {
      return null;
    }

    const selectedFileName = interactionData.textField ?? defaultFileName;
    if (selectedFileName.endsWith(`.${fileHandler.extension}`)) {
      return selectedFileName;
    } else {
      return `${selectedFileName}.${fileHandler.extension}`;
    }
  };

  private saveFileActual = async (lyrics: string, path: string) => {
    try {
      this.logger.debug('Saving file with lyrics', { path, lyrics });

      this.fileDataExtensions.forEach((extension) =>
        extension.onBeforeSerialization?.(lyrics),
      );
      const extensions: SerializedExtensions = {};
      for (const extension of this.fileDataExtensions) {
        extensions[extension.key] = this.buffers.stringToBuffer(
          JSON.stringify(await extension.serialize()),
        );
      }

      // We check based off the path instead of the current file handler being null
      // for the case where we're doing a "Save As", so the current file handler is
      // set but the user still wants to save a new file.
      // If there's a path, then a file should be opened so there should be a
      // current file handler.
      const fileHandler = !path
        ? await this.getDefaultFileHandler()
        : this.currentFile?.handler;

      let defaultFileName = FileManager.generateDefaultFileName(fileHandler);

      if (
        (this.currentFile == null || this.currentFile?.path == null) &&
        !(await this.files.supportsChoosingFileName())
      ) {
        // In the case where the platform won't give the user the ability to select a file name, and the file we're
        // trying to save won't be able to overwrite an existing file (i.e., we have no path or no current file at all),
        // prompt for a file name that we can pass into the platform.
        defaultFileName = await this.getUserSelectedFileName(fileHandler);
        // Cancel out if the user didn't pick a filename
        if (defaultFileName == null) {
          return;
        }
      }

      const serializedFileData = await fileHandler.create({
        extensions,
        lyrics,
      });

      const cancelSignal = this.showLoadingDialog('save', true);
      const newFileMetadata = await makeCancellable(
        this.files.saveFile(serializedFileData, defaultFileName, path),
        cancelSignal,
      );
      if (newFileMetadata && newFileMetadata.path) {
        this.showLoadingDialog('save');
        const fileTitle = newFileMetadata.name ?? newFileMetadata.path;
        this.currentFile = {
          path: newFileMetadata.path,
          handler: fileHandler,
        };
        this.rendererDelegate.send('file-opened', undefined, lyrics, true);
        this.addRecentFile(newFileMetadata.path);
        this.fileChangedListeners.forEach((listener) =>
          listener(fileTitle, this.recentFiles.getRecentFiles()),
        );
        this.rendererDelegate.send('file-save-ended', null, fileTitle);
      } else {
        this.rendererDelegate.send('file-save-ended', null, null);
      }
    } catch (e) {
      this.logger.error('Error saving file', e);
    } finally {
      this.rendererDelegate.send(
        'close-dialog',
        FileManager.SAVE_FILE_DIALOG_TAG,
      );
    }
  };

  private openFileActual = async (platformFile: PlatformFile) => {
    this.showLoadingDialog('open');
    const { handler, fileData } = await this.createFileData(platformFile);

    this.currentFile = {
      path: platformFile.metadata.path,
      handler,
    };

    for (const extension of this.fileDataExtensions) {
      const data = this.buffers.bufferToString(
        fileData.extensions?.[extension.key],
      );
      if (data?.length > 0) {
        await extension.deserialize(JSON.parse(data));
      } else {
        extension.reset();
      }
    }
    this.rendererDelegate.send(
      'file-opened',
      undefined,
      fileData?.lyrics ?? '',
      true,
    );
    this.addRecentFile(this.currentFile.path);
    const updatedRecentFiles = this.recentFiles.getRecentFiles();
    this.fileChangedListeners.forEach((listener) =>
      listener(
        platformFile.metadata.name ?? platformFile.metadata.path,
        updatedRecentFiles,
      ),
    );
  };

  private createNewFile = () => {
    this.currentFile = null;
    this.rendererDelegate.send('new-file-created');
    this.fileDataExtensions.forEach((extension) => extension.reset());
    this.fileChangedListeners.forEach((listener) =>
      listener(null, this.recentFiles.getRecentFiles()),
    );
  };

  private onPromptSaveFileForNew = async () => {
    const { selectedButton } = await showRendererDialog(this.rendererDelegate, {
      tag: FileManager.CONFIRM_NEW_FILE_TAG,
      type: 'alert',
      title: 'Discard unsaved changes?',
      message:
        "Your changes haven't been saved. Are you sure you want to create a new file?",
      buttons: ['Cancel', 'Create new file'],
    });

    if (selectedButton === 'Create new file') {
      this.createNewFile();
    } else {
      this.logger.debug('User selected to not create a new file.');
    }
  };

  private onPromptSaveFileForOpen = async (file?: PlatformFile) => {
    const { selectedButton } = await showRendererDialog(this.rendererDelegate, {
      tag: FileManager.CONFIRM_OPEN_FILE_TAG,
      type: 'alert',
      title: 'Discard unsaved changes?',
      message:
        "Your changes haven't been saved. Are you sure you want to open a different file?",
      buttons: ['Cancel', 'Open file'],
    });

    if (selectedButton === 'Open file') {
      await this.openFile(file);
    } else {
      this.logger.debug('User selected to not open file', file?.metadata);
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
    const handler = this.fileHandlers.find((it) => it.canHandle(file));
    return {
      handler,
      fileData: await handler?.load(file),
    };
  };

  /**
   * Shows a full screen dialog over the renderer to denote that the FileManager
   * is doing potentially long running work.
   *
   * @param type Whether the long running work is for opening or saving files.
   * @param cancelable Whether the dialog can be cancelled by the user.
   */
  private showLoadingDialog = (
    type: 'open' | 'save',
    cancelable = false,
  ): CancelSignal | null => {
    this.logger.debug(`Showing ${type} dialog`);
    const tag =
      type === 'open'
        ? FileManager.OPEN_FILE_DIALOG_TAG
        : FileManager.SAVE_FILE_DIALOG_TAG;
    this.rendererDelegate.send('show-dialog', {
      tag,
      type: 'fullscreen',
      message: `${type === 'open' ? 'Opening' : 'Saving'} file`,
      progress: 'indeterminate',
      cancelable,
    });
    if (cancelable === true) {
      const cancellable = new Cancellable();
      const onDialogClosed = (closedTag: string) => {
        if (closedTag === tag) {
          this.logger.debug(`Stopping ${type} dialog`);
          this.rendererDelegate.removeListener('dialog-closed', onDialogClosed);
          cancellable.cancel();
        }
      };
      this.rendererDelegate.on('dialog-closed', onDialogClosed);
      return cancellable.signal;
    }
  };

  private promptFileHandlerSelection = async (): Promise<FileHandler> => {
    const lyricsHandler = this.fileHandlers.find(
      (handler) => handler.extension === 'lyrics',
    );
    const textHandler = this.fileHandlers.find(
      (handler) => handler.extension === 'txt',
    );

    const lyricsOption = 'Lyricistant file (.lyrics)';
    const textOption = 'Plain text (.txt)';
    const neverAskAgainLabel = 'Never ask again';

    const interactionData = await showRendererDialog(this.rendererDelegate, {
      tag: FileManager.CHOOSE_FILE_HANDLER_TAG,
      type: 'selection',
      title: 'Select file type',
      checkbox: {
        label: neverAskAgainLabel,
      },
      message:
        'What file type to save as? Text files have wide compatibility, but Lyrics files support all Lyricistant features.',
      options: [lyricsOption, textOption],
    });

    if (interactionData.checkboxes?.[neverAskAgainLabel]) {
      const preferencesData = await getPreferencesDataOrDefault(
        this.preferences,
      );
      await this.preferences.setPreferences({
        ...preferencesData,
        defaultFileType:
          interactionData.selectedOption === textOption
            ? DefaultFileType.Plain_Text
            : DefaultFileType.Lyricistant_Lyrics,
      });
    }
    if (interactionData.selectedOption === textOption) {
      return textHandler;
    }
    return lyricsHandler;
  };

  private getDefaultFileHandler = async (): Promise<FileHandler> => {
    const preferencesData = await getPreferencesDataOrDefault(this.preferences);
    const textFileHandler = this.fileHandlers.find(
      (handler) => handler.extension === 'txt',
    );
    const lyricsFileHandler = this.fileHandlers.find(
      (handler) => handler.extension === 'lyrics',
    );

    switch (preferencesData.defaultFileType) {
      case DefaultFileType.Always_Ask:
        return await this.promptFileHandlerSelection();
      case DefaultFileType.Plain_Text:
        return textFileHandler;
      default:
        return lyricsFileHandler;
    }
  };
}
