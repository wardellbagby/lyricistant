import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  SystemPalette,
  SystemTheme,
  SystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import {
  ColorScheme,
  DisplayableColorScheme,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';

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

        this.sendThemeUpdate(await this.preferencesOrDefault());
      }
    );
    this.rendererDelegate.addRendererListenerSetListener(
      'prefs-updated',
      async () => {
        this.rendererDelegate.send(
          'prefs-updated',
          await this.preferencesOrDefault()
        );
      }
    );
    this.rendererDelegate.addRendererListenerSetListener(
      'theme-updated',
      async () => {
        this.sendThemeUpdate(await this.preferencesOrDefault());
      }
    );
  }

  public addThemeChangedListener = (
    listener: (theme: ColorScheme, systemPalette: SystemPalette) => void
  ) => {
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

  private preferencesOrDefault = async (): Promise<PreferencesData> => ({
    textSize: 16,
    colorScheme: ColorScheme.System,
    rhymeSource: RhymeSource.Datamuse,
    font: Font.Roboto_Mono,
    ...((await this.preferences.getPreferences()) as Partial<PreferencesData>),
  });

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
