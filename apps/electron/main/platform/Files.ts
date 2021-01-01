import { DroppableFile, FileData, Files as IFiles } from '@common/files/Files';
import { dialog } from 'electron';
import { promises as fs } from 'fs';
import { isText } from 'istextorbinary';
import { mainWindow } from '../index';

export class ElectronFiles implements IFiles {
  public openFile = async (file?: DroppableFile) => {
    if (file) {
      const data = await Buffer.from(file.data);
      if (isText(file.path, data)) {
        return new FileData(file.path, data.toString('utf8'));
      }
      throw Error(`Cannot open "${file.path}; not a text file."`);
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Lyrics',
      properties: ['openFile'],
      filters: [
        { extensions: ['txt'], name: 'Lyrics' },
        { extensions: ['*'], name: 'All Files' },
      ],
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
    const data = await fs.readFile(filePath);
    if (isText(filePath, data)) {
      return new FileData(filePath, data.toString('utf8'));
    }
    throw Error(`Cannot open "${filePath}; not a text file."`);
  };
}
