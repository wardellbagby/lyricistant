import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider
} from 'common/theme/SystemTheme';

class WebSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    listener(SystemTheme.Dark);
  };
}

export type SystemThemeProvider = WebSystemThemeProvider;
export const SystemThemeProvider = WebSystemThemeProvider;
