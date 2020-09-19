import { fileOpen, fileSave } from 'browser-nativefs';
import { FileData, Files as IFiles } from 'common/files/Files';
import { logger } from 'platform/Logger';

class WebFiles implements IFiles {
  public openFile = async () => {
    const result = await fileOpen({ mimeTypes: ['txt/*'], multiple: false });

    if (result) {
      return new FileData(result.name, await readAsText(result));
    } else {
      logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (file: FileData): Promise<undefined> => {
    await fileSave(new Blob([file.data]), {
      fileName: file.filePath,
      extensions: ['txt']
    });

    return undefined;
  };
}

const readAsText = async (blob: Blob): Promise<string> => {
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

export type Files = IFiles;
export const Files = WebFiles;
