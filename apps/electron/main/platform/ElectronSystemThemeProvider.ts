import { SystemTheme } from '@lyricistant/common/theme/SystemTheme';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { NativeTheme } from 'electron';

export class ElectronSystemThemeProvider implements SystemThemeProvider {
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
