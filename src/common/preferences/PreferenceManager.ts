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
    });
  }
  public unregister(): void {
    this.rendererDelegate.removeListener(
      'ready-for-events',
      this.onRendererReady
    );
  }

  private onRendererReady = (): void => {
    const data = this.preferencesOrDefault();

    this.rendererDelegate.send('prefs-updated', data);
    this.rendererDelegate.send(
      'dark-mode-toggled',
      data.textSize,
      !data.theme || data.theme === Theme.Dark
    );
  };

  private onSavePrefs = (data: PreferencesData): void => {
    if (!data) {
      this.rendererDelegate.send('close-prefs');
      return;
    }

    this.preferences.setPreferences(data);
    this.rendererDelegate.send('prefs-updated', data);
    this.rendererDelegate.send(
      'dark-mode-toggled',
      data.textSize,
      !data.theme || data.theme === Theme.Dark
    );
    this.rendererDelegate.send('close-prefs');
  };

  private preferencesOrDefault = (): PreferencesData => {
    const preferencesData: PreferencesData = this.preferences.getPreferences() ?? {
      textSize: 16,
      theme: Theme.System
    };

    return {
      ...preferencesData,
      theme:
        !preferencesData.theme || preferencesData.theme === Theme.System
          ? this.systemThemeToTheme(this.systemTheme)
          : preferencesData.theme
    };
  };

  private systemThemeToTheme = (systemTheme: SystemTheme): Theme => {
    return systemTheme === SystemTheme.Dark ? Theme.Dark : Theme.Light;
  };
}
