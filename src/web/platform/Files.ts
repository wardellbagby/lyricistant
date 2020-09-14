import { fileOpen, fileSave } from 'browser-nativefs';
import { FileData, Files as IFiles } from 'common/files/Files';

class WebFiles implements IFiles {
  public openFile = async () => {
    const result = await fileOpen({ mimeTypes: ['txt/*'], multiple: false });

    if (result) {
      return new FileData(result.name, await result.text());
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

export type Files = IFiles;
export const Files = WebFiles;
