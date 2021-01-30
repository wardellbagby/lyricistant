import path from 'path';
import { Preferences as IPreferences } from '@common/preferences/Preferences';
import { PreferencesData } from '@common/preferences/PreferencesData';
import { Logger } from '@common/Logger';
import { FileSystem } from '../wrappers/FileSystem';

export class ElectronPreferences implements IPreferences {
  private readonly preferencesFilePath: string;
  private cachedPreferences: PreferencesData;

  public constructor(private fs: FileSystem, private logger: Logger) {
    this.preferencesFilePath = path.resolve(
      this.fs.getDataDirectory('userData'),
      'preferences.json'
    );
  }

  public getPreferences = (): PreferencesData | undefined => {
    if (this.fs.existsSync(this.preferencesFilePath)) {
      this.cachedPreferences = JSON.parse(
        this.fs.readFileSync(this.preferencesFilePath, 'utf8')
      );
      return this.cachedPreferences;
    } else {
      return undefined;
    }
  };
  public setPreferences = (data: PreferencesData) => {
    this.cachedPreferences = data;
    this.fs
      .writeFile(this.preferencesFilePath, JSON.stringify(data))
      .catch((reason) =>
        this.logger.warn('Failed to saved preferences', reason)
      );
  };
}
