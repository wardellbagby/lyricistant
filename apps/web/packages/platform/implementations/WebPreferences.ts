import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';
import { renderer } from '@web-platform/renderer';

export class WebPreferences implements Preferences {
  private readonly prefsKey = 'lyricistant_preferences';
  public setPreferences = async (data: PreferencesData) => {
    const storage = await renderer.getLocalStorage();
    storage.setItem(this.prefsKey, JSON.stringify(data));
  };
  public getPreferences = async () => {
    const storage = await renderer.getLocalStorage();
    const savedPrefs = await storage.getItem(this.prefsKey);
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    } else {
      return undefined;
    }
  };
}
