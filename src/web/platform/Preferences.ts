import { Preferences as IPreferences } from 'common/preferences/Preferences';
import { PreferencesData } from 'common/preferences/PreferencesData';

class WebPreferences implements IPreferences {
  private readonly prefsKey = 'lyricist_preferences';
  public setPreferences: (data: PreferencesData) => void = (data) =>
    localStorage.setItem(this.prefsKey, JSON.stringify(data));
  public getPreferences: () => PreferencesData | undefined = () => {
    const savedPrefs = localStorage.getItem('lyricistant_preferences');
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    } else {
      return undefined;
    }
  };
}

export type Preferences = WebPreferences;
export const Preferences = WebPreferences;
