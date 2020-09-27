import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider,
} from 'common/theme/SystemTheme';
import { nativeTheme } from 'electron';

export class ElectronSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    listener(this.getSystemTheme());

    nativeTheme.on('updated', () => {
      listener(this.getSystemTheme());
    });
  };

  private getSystemTheme = (): SystemTheme =>
    nativeTheme.shouldUseDarkColors ? SystemTheme.Dark : SystemTheme.Light;
}
