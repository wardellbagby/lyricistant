import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  SystemTheme,
  SystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import {
  PreferencesData,
  RhymeSource,
  Theme,
} from '@lyricistant/common/preferences/PreferencesData';

export class PreferenceManager implements Manager {
  private systemTheme: SystemTheme;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private systemThemeProvider: SystemThemeProvider,
    private preferences: Preferences
  ) {}

  public register(): void {
    this.rendererDelegate.on('save-prefs', this.onSavePrefs);
    this.systemThemeProvider.onChange((systemTheme: SystemTheme) => {
      this.systemTheme = systemTheme;
      this.sendThemeUpdate(this.preferencesOrDefault());
    });
    this.rendererDelegate.addRendererListenerSetListener(
      'prefs-updated',
      () => {
        this.rendererDelegate.send(
          'prefs-updated',
          this.preferencesOrDefault()
        );
      }
    );
    this.rendererDelegate.addRendererListenerSetListener(
      'dark-mode-toggled',
      () => {
        this.sendThemeUpdate(this.preferencesOrDefault());
      }
    );
  }

  private onSavePrefs = (data: PreferencesData): void => {
    if (!data) {
      this.rendererDelegate.send('close-prefs');
      return;
    }

    this.preferences.setPreferences(data);
    this.rendererDelegate.send('prefs-updated', data);
    this.sendThemeUpdate(data);
    this.rendererDelegate.send('close-prefs');
  };

  private preferencesOrDefault = (): PreferencesData => ({
    textSize: 16,
    theme: Theme.System,
    rhymeSource: RhymeSource.Datamuse,
    ...this.preferences.getPreferences(),
  });

  private sendThemeUpdate = (data: PreferencesData): void => {
    const theme = this.normalizeTheme(data.theme);
    this.rendererDelegate.send(
      'dark-mode-toggled',
      data.textSize,
      theme === undefined || theme === null || theme === Theme.Dark
    );
  };

  private normalizeTheme(theme: Theme): Theme {
    return theme === Theme.System
      ? this.systemThemeToTheme(this.systemTheme)
      : theme;
  }

  private systemThemeToTheme = (systemTheme: SystemTheme): Theme =>
    systemTheme === SystemTheme.Dark ? Theme.Dark : Theme.Light;
}
