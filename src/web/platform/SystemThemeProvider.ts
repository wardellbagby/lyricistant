import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider,
} from 'common/theme/SystemTheme';

export class WebSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        listener(SystemTheme.Dark);
      } else {
        listener(SystemTheme.Light);
      }
    } else {
      listener(SystemTheme.Dark);
    }

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        listener(e.matches ? SystemTheme.Dark : SystemTheme.Light);
      });
  };
}
