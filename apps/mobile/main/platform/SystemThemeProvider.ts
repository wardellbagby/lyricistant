import {
  SystemTheme,
  SystemThemeProvider as ISystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';

declare global {
  interface Window {
    /**
     * Android doesn't support prefers-color-scheme and posting updates when it changes.
     * It uses this to update the renderer instead.
     *
     * @param dark Whether dark theme is enabled.
     */
    onNativeThemeChanged: (dark: boolean) => void;
  }

  /**
   * Similar to [window.onNativeThemeChanged], Android doesn't provide a nice way of immediately getting the dark
   * theme value, so it'll instead provide this to the renderer.
   */
  const nativeThemeProvider: { isDarkTheme: () => boolean } | undefined;
}

export class MobileSystemThemeProvider implements ISystemThemeProvider {
  public onChange = (listener: (theme: SystemTheme) => void) => {
    window.onNativeThemeChanged = (dark: boolean) => {
      listener(dark ? SystemTheme.Dark : SystemTheme.Light);
    };

    if (typeof nativeThemeProvider !== 'undefined') {
      if (nativeThemeProvider?.isDarkTheme()) {
        listener(SystemTheme.Dark);
        return;
      } else if (nativeThemeProvider?.isDarkTheme() === false) {
        listener(SystemTheme.Light);
        return;
      }
    }

    if (window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
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
}
