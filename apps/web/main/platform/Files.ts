import {
  DroppableFile,
  FileData,
  FileMetadata,
  Files as IFiles,
} from '@lyricistant/common/files/Files';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystem } from '../wrappers/FileSystem';

export class WebFiles implements IFiles {
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

    let result: File;
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
      return {
        path: result.name,
        data: await readAsText(result),
      };
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (
    data: string,
    path?: string
  ): Promise<FileMetadata> => {
    const fileName = path ?? 'Lyrics.txt';
    let fileHandle;
    try {
      fileHandle = await this.fs.saveFile(
        new Blob([data], {
          type: 'text/plain',
        }),
        {
          fileName,
          extensions: ['.txt'],
        }
      );
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

    return { path: fileHandle?.name ?? fileName };
  };
}

const readAsText = async (blob: Blob): Promise<string> => {
  if (blob.type !== 'text/plain') {
    throw Error('Selected file is not a text file.');
  }
  if (Blob.prototype.text) {
    return await blob.text();
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject('Failed to load file');
    reader.readAsText(blob, 'utf-8');
  });
};
