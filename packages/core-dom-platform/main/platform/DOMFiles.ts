import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import { Logger } from '@lyricistant/common/Logger';
import {
  Files,
  LYRICS_MIME_TYPE,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from '@lyricistant/common-platform/files/Files';
import { FileSystem } from '@lyricistant/core-dom-platform/wrappers/FileSystem';

/**
 * Runs the specified block but catch and ignore any AbortErrors, which are
 * generally fired when the user cancels an open or save dialog box.
 *
 * @param logger The logger to use to log information.
 * @param block The block of code to run.
 */
export const runIgnoringAbortErrors = async <R>(
  logger: Logger,
  block: () => R | Promise<R>,
): Promise<{ result?: R; cancelled: boolean }> => {
  try {
    return { result: await block(), cancelled: false };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      logger.verbose(
        'Swallowing exception since user closed the open file picker',
        e,
      );
      return { cancelled: true };
    } else {
      throw e;
    }
  }
};

export class DOMFiles implements Files {
  /*
    An in-memory mapping of generated IDs to FileSystemHandles. We'd prefer for
    these to be given to the FileManager and fed back to us, but
    FileSystemHandle cannot be serialized to JSON and restored to the same
    FileSystemHandle.
   */
  private fileHandles: Map<string, FileSystemFileHandle> = new Map();
  private counter = 0;

  public constructor(
    private fs: FileSystem,
    private logger: Logger,
  ) {}

  public supportsChoosingFileName = () => true;

  public openFile = async (file?: PlatformFile): Promise<PlatformFile> => {
    if (file) {
      return file;
    }

    const { result } = await runIgnoringAbortErrors(this.logger, () =>
      this.fs.openFile({
        mimeTypes: SUPPORTED_MIME_TYPES,
        extensions: SUPPORTED_EXTENSIONS,
        multiple: false,
      }),
    );

    if (result) {
      const handleId = this.generateFileHandleId();
      this.fileHandles.set(handleId, result.handle);
      return {
        metadata: { path: handleId, name: result.name },
        data: await result.arrayBuffer(),
        type: result.type,
      };
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (
    data: ArrayBuffer,
    defaultFilename: string,
    fileHandleId?: string,
  ): Promise<FileMetadata> => {
    const fileHandle = this.fileHandles.get(fileHandleId);
    const { result, cancelled } = await runIgnoringAbortErrors(
      this.logger,
      () =>
        this.fs.saveFile(
          new Blob([data], {
            type: LYRICS_MIME_TYPE,
          }),
          {
            fileName: defaultFilename,
          },
          fileHandle,
        ),
    );
    if (cancelled) {
      return null;
    }
    const handleId = fileHandleId ?? this.generateFileHandleId();
    this.fileHandles.set(handleId, result);
    return { path: handleId, name: result.name ?? defaultFilename };
  };

  private generateFileHandleId(): string {
    const id = `${Date.now()}+${this.counter}`;
    this.counter += 1;
    return id;
  }
}
