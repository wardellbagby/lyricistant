import { Manager } from '@lyricistant/common/Manager';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Logger } from '@lyricistant/common/Logger';
import { Theme } from '@lyricistant/common/preferences/PreferencesData';

export class StatusBarManager implements Manager {
  public constructor(
    private preferenceManager: PreferenceManager,
    private logger: Logger
  ) {}

  public register() {
    this.preferenceManager.addThemeChangedListener((theme) => {
      let style: Style;
      let color: string;
      switch (theme) {
        case Theme.Light:
          style = Style.Light;
          color = '#E0E0E0';
          break;
        case Theme.Dark:
          style = Style.Dark;
          color = '#232323';
          break;
        case Theme.System:
          style = Style.Default;
          color = null;
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
