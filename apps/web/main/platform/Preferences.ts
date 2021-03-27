import { Preferences as IPreferences } from '@lyricistant/common/preferences/Preferences';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';

export class WebPreferences implements IPreferences {
  private readonly prefsKey = 'lyricistant_preferences';
  public setPreferences: (data: PreferencesData) => void = (data) =>
    localStorage.setItem(this.prefsKey, JSON.stringify(data));
  public getPreferences = () => {
    const savedPrefs = localStorage.getItem(this.prefsKey);
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    } else {
      return undefined;
    }
  };
}
