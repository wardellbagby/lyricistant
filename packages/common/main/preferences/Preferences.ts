import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';

export interface Preferences {
  getPreferences: () => Promise<PreferencesData | void>;
  setPreferences: (data: PreferencesData) => Promise<void>;
}
