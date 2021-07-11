import {
  DroppableFile,
  FileData,
  FileMetadata,
  Files as IFiles,
} from '@lyricistant/common/files/Files';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystemHandle, FileWithHandle } from 'browser-fs-access';
import { FileSystem } from '@web-app/wrappers/FileSystem';

export class WebFiles implements IFiles {
  /*
    An in-memory mapping of generated IDs to FileSystemHandles. We'd prefer for
    these to be given to the FileManager and fed back to us, but
    FileSystemHandle cannot be serialized to JSON and restored to the same
    FileSystemHandle.
   */
  private fileHandles: Map<string, FileSystemHandle> = new Map();
  private counter = 0;

  public constructor(private fs: FileSystem, private logger: Logger) {}

  public openFile = async (file?: DroppableFile): Promise<FileData> => {
    if (file) {
      if (file.type !== 'text/plain') {
        throw Error('Selected file is not a text file.');
      }
      return {
        path: file.path,
        data: new TextDecoder().decode(file.data),
      };
    }

    let result: FileWithHandle;
    try {
      result = await this.fs.openFile({
        mimeTypes: ['text/plain'],
        extensions: ['.txt'],
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
        path: handleId,
        name: result.name,
        data: await readAsText(result),
      };
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (
    data: string,
    fileHandleId?: string
  ): Promise<FileMetadata> => {
    const defaultFilename = 'Lyrics.txt';
    const fileHandle = this.fileHandles.get(fileHandleId);
    try {
      const result = await this.fs.saveFile(
        new Blob([data], {
          type: 'text/plain',
        }),
        {
          fileName: defaultFilename,
          extensions: ['.txt'],
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

const readAsText = async (blob: Blob): Promise<string> => {
  if (blob.type !== 'text/plain') {
    throw Error(`Selected file of type "${blob.type}" is not a text file.`);
  }
  if (Blob.prototype.text || blob.text) {
    return await blob.text();
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject('Failed to load file');
    reader.readAsText(blob, 'utf-8');
  });
};
