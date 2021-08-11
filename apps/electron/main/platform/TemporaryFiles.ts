import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { Logger } from '@lyricistant/common/Logger';
import { FileSystem } from '@electron-app/wrappers/FileSystem';

export class ElectronTemporaryFiles implements TemporaryFiles {
  private temporaryFile = this.fs.resolve(
    this.fs.getDataDirectory('temp'),
    'temp_lyrics.txt'
  );

  public constructor(private fs: FileSystem, private logger: Logger) {}

  public set = (data: string | null) => {
    this.fs
      .writeFile(this.temporaryFile, data)
      .catch((reason) =>
        this.logger.warn(
          'Failed to save to temporary file!',
          reason,
          this.temporaryFile
        )
      );
  };
  public get = async () =>
    this.fs.readFile(this.temporaryFile, { encoding: 'utf8' });

  public exists = () => this.fs.existsSync(this.temporaryFile);
  public delete = () => {
    if (this.exists()) {
      this.fs
        .unlink(this.temporaryFile)
        .catch((reason) =>
          this.logger.warn(
            'Failed to delete temporary file!',
            reason,
            this.temporaryFile
          )
        );
    }
  };
}
