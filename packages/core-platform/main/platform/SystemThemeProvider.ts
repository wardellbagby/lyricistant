import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';

export class CoreSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    setColorSchemeListener(listener);
  };
}

export const setColorSchemeListener = (
  listener: (theme: SystemTheme) => void
) => {
  if (self.matchMedia) {
    if (self.matchMedia('(prefers-color-scheme: dark)').matches) {
      listener(SystemTheme.Dark);
    } else {
      listener(SystemTheme.Light);
    }
  } else {
    listener(SystemTheme.Dark);
    return;
  }

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      listener(e.matches ? SystemTheme.Dark : SystemTheme.Light);
    });
};
