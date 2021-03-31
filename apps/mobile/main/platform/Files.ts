import { registerPlugin } from '@capacitor/core';
import {
  DroppableFile,
  FileData,
  FileMetadata,
  Files as IFiles,
} from '@lyricistant/common/files/Files';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystem } from '../wrappers/FileSystem';

interface MobileFilesPlugin {
  openFile: () => Promise<FileData | null>;
  saveFile: (fileData: FileData) => Promise<FileMetadata>;
}

const mobileFilesPlugin = registerPlugin<MobileFilesPlugin>('Files');

export class MobileFiles implements IFiles {
  public constructor(private fs: FileSystem, private logger: Logger) {}

  public openFile = async () => {
    const result = await mobileFilesPlugin.openFile();
    if (result) {
      return result;
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (file: FileData): Promise<FileMetadata> =>
    mobileFilesPlugin.saveFile(file);
}
