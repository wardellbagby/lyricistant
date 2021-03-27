import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { NativeTheme } from 'electron';

export class ElectronSystemThemeProvider implements ISystemThemeProvider {
  public constructor(private nativeTheme: NativeTheme) {}
  public onChange = (listener: (theme: SystemTheme) => void) => {
    listener(this.getSystemTheme());

    this.nativeTheme.on('updated', () => {
      listener(this.getSystemTheme());
    });
  };

  private getSystemTheme = (): SystemTheme =>
    this.nativeTheme.shouldUseDarkColors ? SystemTheme.Dark : SystemTheme.Light;
}
