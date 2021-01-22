import { RendererDelegate } from '../Delegates';
import { Manager } from '../Manager';
import { SystemTheme, SystemThemeProvider } from '../theme/SystemTheme';
import { Preferences } from './Preferences';
import { PreferencesData, Theme } from './PreferencesData';

export class PreferenceManager implements Manager {
  private systemTheme: SystemTheme;

  constructor(
    private rendererDelegate: RendererDelegate,
    private systemThemeProvider: SystemThemeProvider,
    private preferences: Preferences
  ) {}

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('save-prefs', this.onSavePrefs);
    this.systemThemeProvider.onChange((systemTheme: SystemTheme) => {
      this.systemTheme = systemTheme;
      this.sendThemeUpdate(this.preferencesOrDefault());
    });
  }

  private onRendererReady = (): void => {
    const data = this.preferencesOrDefault();

    this.rendererDelegate.send('prefs-updated', data);
    this.sendThemeUpdate(data);
  };

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

  private preferencesOrDefault = (): PreferencesData => {
    return {
      textSize: 16,
      theme: Theme.System,
      ...this.preferences.getPreferences(),
    };
  };

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

  private systemThemeToTheme = (systemTheme: SystemTheme): Theme => {
    return systemTheme === SystemTheme.Dark ? Theme.Dark : Theme.Light;
  };
}
