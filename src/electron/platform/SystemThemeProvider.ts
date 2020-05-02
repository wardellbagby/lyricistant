import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider
} from 'common/theme/SystemTheme';
import { nativeTheme } from 'electron';

class ElectronSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    nativeTheme.on('updated', () => {
      listener(
        nativeTheme.shouldUseDarkColors ? SystemTheme.Dark : SystemTheme.Light
      );
    });
  };
}

export type SystemThemeProvider = ElectronSystemThemeProvider;
export const SystemThemeProvider = ElectronSystemThemeProvider;
