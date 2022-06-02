import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { Logger } from '@lyricistant/common/Logger';

export class ElectronAppData implements AppData {
  public constructor(private fs: FileSystem, private logger: Logger) {}

  public set = (key: string, data: string | null) => {
    this.fs
      .writeFile(this.getAppDataFile(key), data)
      .catch((reason) =>
        this.logger.warn(
          'Failed to save app data!',
          reason,
          this.getAppDataFile(key)
        )
      );
  };
  public get = async (key: string) =>
    this.fs.readFile(this.getAppDataFile(key), { encoding: 'utf8' });

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
      this.fs.getDataDirectory('appData'),
      `${key.replaceAll(/[ #%&{}\\<>*?\/$!'":@]/g, '_')}.json`
    );
}
