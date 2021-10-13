import { Manager } from '@lyricistant/common/Manager';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Logger } from '@lyricistant/common/Logger';
import { ColorScheme } from '@lyricistant/common/preferences/PreferencesData';

export class StatusBarManager implements Manager {
  public constructor(
    private preferenceManager: PreferenceManager,
    private logger: Logger
  ) {}

  public register() {
    this.preferenceManager.addThemeChangedListener((theme, systemPalette) => {
      let style: Style;
      let color: string;
      switch (theme) {
        case ColorScheme.Light:
          style = Style.Light;
          color = systemPalette?.surface ?? '#E0E0E0';
          break;
        case ColorScheme.Dark:
          style = Style.Dark;
          color = systemPalette?.surface ?? '#232323';
          break;
        case ColorScheme.System:
          style = Style.Default;
          color = systemPalette?.surface;
          break;
      }
      StatusBar.setStyle({ style })
        .then(() => StatusBar.setBackgroundColor({ color }))
        .catch((reason) =>
          this.logger.info('Failed to update status bar style', reason)
        );
    });
  }
}
