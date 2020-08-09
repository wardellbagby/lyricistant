import { Preferences as IPreferences } from 'common/preferences/Preferences';
import { PreferencesData } from 'common/preferences/PreferencesData';
import { app } from 'electron';
import { existsSync, readFileSync, writeFile } from 'original-fs';

class ElectronPreferences implements IPreferences {
  private readonly preferencesFilePath = `${app.getPath(
    'userData'
  )}/preferences.json`;
  private cachedPreferences: PreferencesData;

  public getPreferences = (): PreferencesData | undefined => {
    if (existsSync(this.preferencesFilePath)) {
      this.cachedPreferences = JSON.parse(
        readFileSync(this.preferencesFilePath, 'utf8')
      );
      return this.cachedPreferences;
    } else {
      return undefined;
    }
  };
  public setPreferences = (data: PreferencesData) => {
    this.cachedPreferences = data;
    writeFile(this.preferencesFilePath, JSON.stringify(data), () => undefined);
  };
}

export type Preferences = ElectronPreferences;
export const Preferences = ElectronPreferences;
