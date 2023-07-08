import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  ColorScheme,
  DisplayableColorScheme,
  PreferencesData,
} from '@lyricistant/common/preferences/PreferencesData';
import {
  SystemPalette,
  SystemTheme,
} from '@lyricistant/common/theme/SystemTheme';
import { Manager } from '@lyricistant/common-platform/Manager';
import {
  getPreferencesDataOrDefault,
  Preferences,
} from '@lyricistant/common-platform/preferences/Preferences';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';

// TODO Make this manage the renderer palette as well & update StatusBarManager to take advantage.
export class PreferenceManager implements Manager {
  private onThemeChangedListeners: Array<
    (theme: ColorScheme, systemPalette: SystemPalette) => void
  > = [];
  private systemTheme: SystemTheme;
  private systemPalette: SystemPalette;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private systemThemeProvider: SystemThemeProvider,
    private preferences: Preferences
  ) {}

  public register(): void {
    this.rendererDelegate.on('save-prefs', this.onSavePrefs);
    this.systemThemeProvider.onChange(
      async (systemTheme: SystemTheme, palette) => {
        this.systemTheme = systemTheme;
        this.systemPalette = palette;

        this.sendThemeUpdate(
          await getPreferencesDataOrDefault(this.preferences)
        );
      }
    );
    this.rendererDelegate.addRendererListenerSetListener(
      'prefs-updated',
      async () => {
        this.rendererDelegate.send(
          'prefs-updated',
          await getPreferencesDataOrDefault(this.preferences)
        );
      }
    );
    this.rendererDelegate.addRendererListenerSetListener(
      'theme-updated',
      async () => {
        this.sendThemeUpdate(
          await getPreferencesDataOrDefault(this.preferences)
        );
      }
    );
  }

  public addThemeChangedListener = (
    listener: (theme: ColorScheme, systemPalette: SystemPalette) => void
  ) => {
    this.onThemeChangedListeners.push(listener);
  };

  private onSavePrefs = async (data: PreferencesData) => {
    if (!data) {
      return;
    }

    await this.preferences.setPreferences(data);
    this.rendererDelegate.send('prefs-updated', data);
    this.sendThemeUpdate(data);
  };

  private sendThemeUpdate = (data: PreferencesData): void => {
    const colorScheme = this.normalizeColorScheme(data.colorScheme);
    const systemPalette =
      data.colorScheme === ColorScheme.System ? this.systemPalette : undefined;
    this.rendererDelegate.send('theme-updated', {
      ...data,
      colorScheme,
      systemPalette,
    });

    this.onThemeChangedListeners.forEach((listener) =>
      listener(colorScheme, systemPalette)
    );
  };

  private normalizeColorScheme(theme: ColorScheme): DisplayableColorScheme {
    return theme === ColorScheme.System
      ? this.systemThemeToTheme(this.systemTheme)
      : theme;
  }

  private systemThemeToTheme = (
    systemTheme: SystemTheme
  ): DisplayableColorScheme =>
    systemTheme === SystemTheme.Dark ? ColorScheme.Dark : ColorScheme.Light;
}
