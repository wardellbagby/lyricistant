import { DroppableFile, FileData, Files as IFiles } from '@common/files/Files';
import { Logger } from '@common/Logger';
import { fileOpen, fileSave } from 'browser-nativefs';

export class WebFiles implements IFiles {
  public constructor(private logger: Logger) {}

  public openFile = async (file?: DroppableFile) => {
    if (file) {
      if (file.type !== 'text/plain') {
        throw Error('Selected file is not a text file.');
      }
      return new FileData(file.path, new TextDecoder().decode(file.data));
    }
    const result = await fileOpen({
      mimeTypes: ['text/plain'],
      extensions: ['.txt'],
      multiple: false,
    });

    if (result) {
      return new FileData(result.name, await readAsText(result));
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (file: FileData): Promise<string> => {
    const fileName = file.filePath ?? 'Lyrics.txt';
    const fileHandle = await fileSave(new Blob([file.data]), {
      fileName,
      extensions: ['txt'],
    });

    return fileHandle?.name ?? fileName;
  };
}

const readAsText = async (blob: Blob): Promise<string> => {
  if (blob.type !== 'text/plain') {
    throw Error('Selected file is not a text file.');
  }
  if (Blob.prototype.text) {
    return await blob.text();
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve();
    reader.readAsText(blob, 'utf-8');
  });
};
