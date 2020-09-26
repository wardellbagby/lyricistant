import { Manager } from 'common/Manager';
import { SystemTheme } from 'common/theme/SystemTheme';
import { Preferences } from 'platform/Preferences';
import { SystemThemeProvider } from 'platform/SystemThemeProvider';
import { PreferencesData, Theme } from './PreferencesData';

export class PreferenceManager extends Manager {
  private readonly systemThemeProvider: SystemThemeProvider = new SystemThemeProvider();
  private readonly preferences = new Preferences();
  private systemTheme: SystemTheme;

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
    return (
      this.preferences.getPreferences() ?? {
        textSize: 16,
        theme: Theme.System,
      }
    );
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
