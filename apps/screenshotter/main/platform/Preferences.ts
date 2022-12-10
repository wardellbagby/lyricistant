import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';

export class ScreenshotterPreferences implements Preferences {
  public showToggleButton = async (show: boolean) => {
    window.rendererDelegate.send('prefs-updated', {
      ...(await this.getPreferences()),
      detailPaneVisibility: show
        ? DetailPaneVisibility.Toggleable
        : DetailPaneVisibility.Always_Show,
    });
  };

  public getPreferences(): Promise<PreferencesData> {
    return Promise.resolve({
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      rhymeSource: RhymeSource.Datamuse,
      textSize: 16,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
      detailPaneVisibility: DetailPaneVisibility.Always_Show,
    });
  }

  public setPreferences = (): Promise<void> => Promise.resolve(undefined);
}
