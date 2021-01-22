import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { Logger } from '@common/Logger';
import { app } from 'electron';

export class ElectronTemporaryFiles implements TemporaryFiles {
  private temporaryFile = path.resolve(app.getPath('temp'), 'temp_lyrics.txt');

  public constructor(private logger: Logger) {}

  public set = (data: string | null) => {
    fs.writeFile(this.temporaryFile, data).catch((reason) =>
      this.logger.warn(
        'Failed to save to temporary file!',
        reason,
        this.temporaryFile
      )
    );
  };
  public get = async () => fs.readFile(this.temporaryFile, { encoding: 'utf8' });

  public exists = () => existsSync(this.temporaryFile);
  public delete = () => {
    if (this.exists()) {
      fs.unlink(this.temporaryFile).catch((reason) =>
        this.logger.warn(
          'Failed to delete temporary file!',
          reason,
          this.temporaryFile
        )
      );
    }
  };
}
