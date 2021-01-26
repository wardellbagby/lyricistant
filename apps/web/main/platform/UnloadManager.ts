import { Manager } from '@common/Manager';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { Logger } from '@common/Logger';

export class UnloadManager implements Manager {
  public constructor(
    private temporaryFiles: TemporaryFiles,
    private logger: Logger
  ) {}
  public register = () => {
    addEventListener("unload", () => {
      this.logger.info('User is leaving page. Deleting unsaved lyrics.');
      this.temporaryFiles.delete();
    });
  };
}
