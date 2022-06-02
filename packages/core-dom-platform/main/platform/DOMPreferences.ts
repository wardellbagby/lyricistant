import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';

export class DOMPreferences implements Preferences {
  private readonly prefsKey = 'lyricistant_preferences';
  public setPreferences = async (data: PreferencesData) =>
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
