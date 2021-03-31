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

  public openFile = async (file?: DroppableFile) => {
    if (file) {
      if (file.type !== 'text/plain') {
        throw Error('Selected file is not a text file.');
      }
      return new FileData(
        file.path,
        file.path,
        new TextDecoder().decode(file.data)
      );
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
      return new FileData(result.name, result.name, await readAsText(result));
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (file: FileData): Promise<FileMetadata> => {
    const fileName = file.filePath ?? 'Lyrics.txt';
    let fileHandle;
    try {
      fileHandle = await this.fs.saveFile(
        new Blob([file.data], {
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

    return { filePath: fileHandle?.name ?? fileName };
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
