import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  SystemTheme,
  SystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import {
  ColorScheme,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';

export class PreferenceManager implements Manager {
  private onThemeChangedListeners: Array<(theme: ColorScheme) => void> = [];
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
      'theme-updated',
      () => {
        this.sendThemeUpdate(this.preferencesOrDefault());
      }
    );
  }

  public addThemeChangedListener = (listener: (theme: ColorScheme) => void) => {
    this.onThemeChangedListeners.push(listener);
  };

  private onSavePrefs = (data: PreferencesData): void => {
    if (!data) {
      return;
    }

    this.preferences.setPreferences(data);
    this.rendererDelegate.send('prefs-updated', data);
    this.sendThemeUpdate(data);
  };

  private preferencesOrDefault = (): PreferencesData => ({
    textSize: 16,
    colorScheme: ColorScheme.System,
    rhymeSource: RhymeSource.Datamuse,
    font: Font.Roboto_Mono,
    ...(this.preferences.getPreferences() as Partial<PreferencesData>),
  });

  private sendThemeUpdate = (data: PreferencesData): void => {
    const colorScheme = this.normalizeColorScheme(data.colorScheme);
    this.rendererDelegate.send('theme-updated', {
      ...data,
      colorScheme,
    });
    this.onThemeChangedListeners.forEach((listener) => listener(colorScheme));
  };

  private normalizeColorScheme(theme: ColorScheme): ColorScheme {
    return theme === ColorScheme.System
      ? this.systemThemeToTheme(this.systemTheme)
      : theme;
  }

  private systemThemeToTheme = (systemTheme: SystemTheme): ColorScheme =>
    systemTheme === SystemTheme.Dark ? ColorScheme.Dark : ColorScheme.Light;
}
