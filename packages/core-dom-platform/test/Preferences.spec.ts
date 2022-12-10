import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { DOMPreferences } from '@lyricistant/core-dom-platform/platform/DOMPreferences';

describe('Preferences', () => {
  let preferences: Preferences;

  beforeEach(() => {
    preferences = new DOMPreferences();
  });

  it('round-trip works', () => {
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };

    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).toEqual(actual);
  });

  it('updates work', () => {
    const initial: PreferencesData = {
      textSize: 24,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
      detailPaneVisibility: DetailPaneVisibility.Always_Show,
    };

    preferences.setPreferences(initial);
    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).toEqual(actual);
  });
});
