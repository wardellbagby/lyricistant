import { DroppableFile, FileData, Files as IFiles } from '@common/files/Files';
import { BrowserWindow, Dialog as ElectronDialog } from 'electron';
import { FileSystem } from '../wrappers/FileSystem';

export class ElectronFiles implements IFiles {
  public constructor(
    private dialog: ElectronDialog,
    private fs: FileSystem,
    private window: BrowserWindow
  ) {}
  public openFile = async (file?: DroppableFile) => {
    if (file) {
      const data = await Buffer.from(file.data);
      if (this.fs.isText(file.path, data)) {
        return new FileData(file.path, data.toString('utf8'));
      }
      throw Error(`Cannot open "${file.path}; not a text file."`);
    }

    const result = await this.dialog.showOpenDialog(this.window, {
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
      await this.fs.writeFile(file.filePath, file.data);
    } else {
      const result = await this.dialog.showSaveDialog(this.window, {
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (result.filePath) {
        await this.fs.writeFile(result.filePath, file.data);
        return result.filePath;
      }
    }
  };

  public readFile = async (filePath: string) => {
    const data = await this.fs.readFile(filePath);
    if (this.fs.isText(filePath, data)) {
      return new FileData(filePath, data.toString('utf8'));
    }
    throw Error(`Cannot open "${filePath}; not a text file."`);
  };
}
