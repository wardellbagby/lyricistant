import {
  Files,
  LYRICS_MIME_TYPE,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from '@lyricistant/common-platform/files/Files';
import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystem } from '@lyricistant/core-dom-platform/wrappers/FileSystem';
import { FileWithHandle, FileSystemHandle } from 'browser-fs-access';

/**
 * Runs the specified block but catch and ignore any AbortErrors, which are
 * generally fired when the user cancels an open or save dialog box.
 *
 * @param logger The logger to use to log information.
 * @param block The block of code to run.
 */
export const runIgnoringAbortErrors = async <R>(
  logger: Logger,
  block: () => R | Promise<R>
) => {
  try {
    return await block();
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      logger.verbose(
        'Swallowing exception since user closed the open file picker',
        e
      );
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
  private fileHandles: Map<string, FileSystemHandle> = new Map();
  private counter = 0;

  public constructor(private fs: FileSystem, private logger: Logger) {}

  public openFile = async (file?: PlatformFile): Promise<PlatformFile> => {
    if (file) {
      return file;
    }

    const result: FileWithHandle = await runIgnoringAbortErrors(
      this.logger,
      () =>
        this.fs.openFile({
          mimeTypes: SUPPORTED_MIME_TYPES,
          extensions: SUPPORTED_EXTENSIONS,
          multiple: false,
        })
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
    fileHandleId?: string
  ): Promise<FileMetadata> => {
    const fileHandle = this.fileHandles.get(fileHandleId);
    const result = await runIgnoringAbortErrors(this.logger, () =>
      this.fs.saveFile(
        new Blob([data], {
          type: LYRICS_MIME_TYPE,
        }),
        {
          fileName: defaultFilename,
        },
        fileHandle
      )
    );
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
