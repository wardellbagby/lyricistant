import { FileSystem } from '@electron-app/wrappers/FileSystem';
import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import {
  Files,
  LYRICS_EXTENSION,
} from '@lyricistant/common-platform/files/Files';
import { BrowserWindow, Dialog as ElectronDialog } from 'electron';

const DOTLESS_LYRICS_EXTENSIONS = LYRICS_EXTENSION.substring(1);
export class ElectronFiles implements Files {
  public constructor(
    private dialog: ElectronDialog,
    private fs: FileSystem,
    private window: BrowserWindow,
  ) {}

  public supportsChoosingFileName = () => true;

  public openFile = async (file?: PlatformFile): Promise<PlatformFile> => {
    if (file) {
      return file;
    }

    const result = await this.dialog.showOpenDialog(this.window, {
      title: 'Choose lyrics',
      properties: ['openFile'],
      filters: [
        { extensions: [DOTLESS_LYRICS_EXTENSIONS], name: 'Lyrics' },
        { extensions: ['txt'], name: 'Text files' },
        { extensions: ['*'], name: 'All files' },
      ],
    });

    if (result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      return await this.readFile(filePath);
    }
  };

  public saveFile = async (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string,
  ): Promise<FileMetadata> => {
    const buffer = Buffer.from(data);
    if (path) {
      await this.fs.writeFile(path, buffer);
      return { path };
    } else {
      const result = await this.dialog.showSaveDialog(this.window, {
        defaultPath: defaultFileName,
      });

      if (result.filePath) {
        await this.fs.writeFile(result.filePath, buffer);
        return { path: result.filePath };
      }
    }
  };

  public readFile = async (path: string): Promise<PlatformFile> => {
    const data = await this.fs.readFile(path);
    return {
      metadata: { path },
      data,
      type: '',
    };
  };
}
