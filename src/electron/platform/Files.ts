import { FileData, Files as IFiles } from 'common/files/Files';
import { dialog } from 'electron';
import { promises as fs } from 'fs';
import { mainWindow } from '../index';

export class ElectronFiles implements IFiles {
  public openFile = async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Lyrics',
      properties: ['openFile'],
      filters: [{ extensions: ['.txt'], name: 'Lyrics' }],
    });

    if (result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      return await this.readFile(filePath);
    }
  };

  public saveFile = async (file: FileData) => {
    if (file.filePath) {
      await fs.writeFile(file.filePath, file.data);
    } else {
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (result.filePath) {
        await fs.writeFile(result.filePath, file.data);
        return result.filePath;
      }
    }
  };

  public readFile = async (filePath: string) => {
    return new FileData(filePath, await fs.readFile(filePath, 'utf8'));
  };
}
