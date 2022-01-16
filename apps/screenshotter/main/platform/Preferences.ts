import { Preferences } from '@lyricistant/common/preferences/Preferences';
import {
  ColorScheme,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';

export class ScreenshotterPreferences implements Preferences {
  public getPreferences(): Promise<PreferencesData> {
    return Promise.resolve({
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      rhymeSource: RhymeSource.Offline,
      textSize: 16,
    });
  }

  public setPreferences = (): Promise<void> => Promise.resolve(undefined);
}
