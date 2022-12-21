import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';

export interface Preferences {
  getPreferences: () => Promise<Partial<PreferencesData> | void>;
  setPreferences: (data: PreferencesData) => Promise<void>;
  getDefaultPreferences?: () => Promise<Partial<PreferencesData>>;
}

export const getPreferencesDataOrDefault = async (
  preferences: Preferences
): Promise<PreferencesData> => {
  const savedPreferencesData =
    (await preferences.getPreferences()) as Partial<PreferencesData>;
  return {
    textSize: 16,
    colorScheme: ColorScheme.System,
    rhymeSource: RhymeSource.Datamuse,
    font: Font.Roboto,
    defaultFileType: DefaultFileType.Always_Ask,
    detailPaneVisibility: DetailPaneVisibility.Always_Show,
    ...(await preferences.getDefaultPreferences?.()),
    ...savedPreferencesData,
  };
};
