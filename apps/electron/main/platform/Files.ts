import {
  DroppableFile,
  FileData,
  FileMetadata,
  Files as IFiles,
} from '@lyricistant/common/files/Files';
import { BrowserWindow, Dialog as ElectronDialog } from 'electron';
import { FileSystem } from '../wrappers/FileSystem';

export class ElectronFiles implements IFiles {
  public constructor(
    private dialog: ElectronDialog,
    private fs: FileSystem,
    private window: BrowserWindow
  ) {}
  public openFile = async (file?: DroppableFile): Promise<FileData> => {
    if (file) {
      const data = await Buffer.from(file.data);
      if (this.fs.isText(file.path, data)) {
        return {
          path: file.path,
          data: data.toString('utf8'),
        };
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

  public saveFile = async (
    data: string,
    path?: string
  ): Promise<FileMetadata> => {
    if (path) {
      await this.fs.writeFile(path, data);
      return { path };
    } else {
      const result = await this.dialog.showSaveDialog(this.window, {
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (result.filePath) {
        await this.fs.writeFile(result.filePath, data);
        return { path: result.filePath };
      }
    }
  };

  public readFile = async (path: string): Promise<FileData> => {
    const data = await this.fs.readFile(path);
    if (this.fs.isText(path, data)) {
      return {
        path,
        data: data.toString('utf8'),
      };
    }
    throw Error(`Cannot open "${path}; not a text file."`);
  };
}
