import { fileOpen, fileSave } from 'browser-nativefs';
import { FileData, Files as IFiles } from 'common/files/Files';

export class WebFiles implements IFiles {
  constructor(private logger: Logger) {}

  public openFile = async () => {
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

  public saveFile = async (file: FileData): Promise<undefined> => {
    await fileSave(new Blob([file.data]), {
      fileName: file.filePath,
      extensions: ['txt'],
    });

    return undefined;
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
