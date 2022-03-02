import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystem } from '@electron-app/wrappers/FileSystem';

export class ElectronTemporaryFiles implements TemporaryFiles {
  public constructor(private fs: FileSystem, private logger: Logger) {}

  public set = (key: string, data: string | null) => {
    this.fs
      .writeFile(this.getTemporaryFile(key), data)
      .catch((reason) =>
        this.logger.warn(
          'Failed to save to temporary file!',
          reason,
          this.getTemporaryFile(key)
        )
      );
  };
  public get = async (key: string) =>
    this.fs.readFile(this.getTemporaryFile(key), { encoding: 'utf8' });

  public exists = async (key: string) => {
    const file = this.getTemporaryFile(key);
    return this.fs.existsSync(file) && (await this.fs.isReadable(file));
  };

  public delete = async (key: string) => {
    if (await this.exists(key)) {
      this.fs
        .unlink(this.getTemporaryFile(key))
        .catch((reason) =>
          this.logger.warn(
            'Failed to delete temporary file!',
            reason,
            this.getTemporaryFile(key)
          )
        );
    }
  };

  private getTemporaryFile = (key: string) =>
    this.fs.resolve(
      this.fs.getDataDirectory('temp'),
      `${key.replaceAll(/[ #%&{}\\<>*?\/$!'":@]/g, '_')}.json`
    );
}
