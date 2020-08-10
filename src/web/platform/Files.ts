import { fileOpen, fileSave } from 'browser-nativefs';
import { FileData, Files as IFiles } from 'common/files/Files';

class WebFiles implements IFiles {
  public openFile = async () => {
    const result = await fileOpen({ mimeTypes: ['txt/*'], multiple: false });

    if (result) {
      return new FileData(result.name, await result.text());
    }
  };

  public saveFile = async (file: FileData) => {
    await fileSave(new Blob([file.data]), {
      fileName: file.filePath,
      extensions: ['txt']
    });
  };
}

export type Files = WebFiles;
export const Files = WebFiles;
