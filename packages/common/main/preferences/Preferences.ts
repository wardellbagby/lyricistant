import { PreferencesData } from "@lyricistant/common/preferences/PreferencesData";

export interface Preferences {
  getPreferences: () => PreferencesData | undefined;
  setPreferences: (data: PreferencesData) => void;
}
