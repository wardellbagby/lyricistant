import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import {
  ColorScheme,
  DefaultFileType,
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
    };
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
    };

    preferences.setPreferences(initial);
    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).toEqual(actual);
  });
});
