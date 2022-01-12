import { registerPlugin } from '@capacitor/core';
import { FileMetadata, Files } from '@lyricistant/common/files/Files';
import { Logger } from '@lyricistant/common/Logger';

interface MobileFilesPlugin {
  openFile: () => Promise<{ path: string; name?: string; data: number[] }>;
  saveFile: (call: {
    data: number[];
    defaultFileName: string;
    path?: string;
  }) => Promise<FileMetadata>;
}

const mobileFilesPlugin = registerPlugin<MobileFilesPlugin>('Files');

export class MobileFiles implements Files {
  public constructor(private logger: Logger) {}

  public openFile = async () => {
    const result = await mobileFilesPlugin.openFile();
    if (result) {
      const { data, path, name } = result;
      return { metadata: { path, name }, data: new Uint8Array(data) };
    } else {
      this.logger.debug('File open cancelled.');
    }
  };

  public saveFile = async (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string
  ): Promise<FileMetadata> =>
    mobileFilesPlugin.saveFile({
      data: Array.from(new Uint8Array(data)),
      defaultFileName,
      path,
    });
}
