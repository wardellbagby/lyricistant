import { registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { FileMetadata } from '@lyricistant/common/files/PlatformFile';
import { Logger } from '@lyricistant/common/Logger';
import { Files } from '@lyricistant/common-platform/files/Files';

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

  public supportsChoosingFileName = async () => {
    const platform = (await Device.getInfo()).platform;
    return platform !== 'ios';
  };

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
    path?: string,
  ): Promise<FileMetadata> =>
    mobileFilesPlugin.saveFile({
      data: Array.from(new Uint8Array(data)),
      defaultFileName,
      path,
    });
}
