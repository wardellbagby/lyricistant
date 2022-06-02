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

    let result: FileWithHandle;
    try {
      result = await this.fs.openFile({
        mimeTypes: SUPPORTED_MIME_TYPES,
        extensions: SUPPORTED_EXTENSIONS,
        multiple: false,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        this.logger.verbose(
          'Swallowing exception since user closed the open file picker',
          e
        );
      } else {
        throw e;
      }
    }

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
    try {
      const result = await this.fs.saveFile(
        new Blob([data], {
          type: LYRICS_MIME_TYPE,
        }),
        {
          fileName: defaultFilename,
        },
        fileHandle
      );
      const handleId = fileHandleId ?? this.generateFileHandleId();
      this.fileHandles.set(handleId, result);
      return { path: handleId, name: result.name ?? defaultFilename };
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        this.logger.verbose(
          'Swallowing exception since user closed the save file picker',
          e
        );
      } else {
        throw e;
      }
    }
  };

  private generateFileHandleId(): string {
    const id = `${Date.now()}+${this.counter}`;
    this.counter += 1;
    return id;
  }
}
