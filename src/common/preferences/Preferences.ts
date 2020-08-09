import { PreferencesData } from './PreferencesData';

export interface Preferences {
  getPreferences: () => PreferencesData | undefined;
  setPreferences: (data: PreferencesData) => void;
}
