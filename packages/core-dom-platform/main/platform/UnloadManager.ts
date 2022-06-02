import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { Manager } from '@lyricistant/common-platform/Manager';

export class UnloadManager implements Manager {
  public constructor(
    private appData: AppData,
    private logger: PlatformLogger
  ) {}

  public register = () => {
    addEventListener('unload', () => {
      this.logger.info('User is leaving page. Deleting unsaved lyrics.');
      this.logger.flush?.();

      // TODO Managers shouldn't creep into each other implementations like this.
      this.appData.delete(UnsavedDataManager.UNSAVED_LYRICS_KEY);
    });
  };
}
