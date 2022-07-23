import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { Logger } from '@lyricistant/common/Logger';
import { Serializable } from '@lyricistant/common/Serializable';

export class ElectronAppData implements AppData {
  public constructor(private fs: FileSystem, private logger: Logger) {}

  public set = (key: string, data: Serializable) => {
    this.fs
      .writeFile(this.getAppDataFile(key), JSON.stringify(data))
      .catch((reason) =>
        this.logger.warn(
          'Failed to save app data!',
          reason,
          this.getAppDataFile(key)
        )
      );
  };
  public get = async (key: string) => {
    try {
      const result = await this.fs.readFile(this.getAppDataFile(key), {
        encoding: 'utf8',
      });
      return JSON.parse(result);
    } catch (e) {
      this.logger.warn('Error when attempting to retrieve data', { key }, e);
    }
  };

  public exists = async (key: string) => {
    const file = this.getAppDataFile(key);
    return this.fs.existsSync(file) && (await this.fs.isReadable(file));
  };

  public delete = async (key: string) => {
    if (await this.exists(key)) {
      this.fs
        .unlink(this.getAppDataFile(key))
        .catch((reason) =>
          this.logger.warn(
            'Failed to delete app data!',
            reason,
            this.getAppDataFile(key)
          )
        );
    }
  };

  private getAppDataFile = (key: string) =>
    this.fs.resolve(
      this.fs.getDataDirectory('userData'),
      `${key.replaceAll(/[ #%&{}\\<>*?\/$!'":@]/g, '_')}.json`
    );
}
