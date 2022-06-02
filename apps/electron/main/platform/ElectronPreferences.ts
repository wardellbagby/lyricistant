import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { Logger } from '@lyricistant/common/Logger';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';

export class ElectronPreferences implements Preferences {
  private readonly preferencesFilePath: string;
  private cachedPreferences: PreferencesData;

  public constructor(private fs: FileSystem, private logger: Logger) {
    this.preferencesFilePath = this.fs.resolve(
      this.fs.getDataDirectory('userData'),
      'preferences.json'
    );
  }

  public getPreferences = async (): Promise<PreferencesData | void> => {
    if (
      !this.cachedPreferences &&
      this.fs.existsSync(this.preferencesFilePath)
    ) {
      this.cachedPreferences = JSON.parse(
        this.fs.readFileSync(this.preferencesFilePath, 'utf8')
      );
    }
    return this.cachedPreferences;
  };

  public setPreferences = async (data: PreferencesData) => {
    this.cachedPreferences = data;
    this.fs
      .writeFile(this.preferencesFilePath, JSON.stringify(data))
      .catch((reason) =>
        this.logger.warn('Failed to saved preferences', reason)
      );
  };
}
