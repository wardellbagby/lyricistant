import {
  SystemPalette,
  SystemTheme,
  SystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { setColorSchemeListener } from '@lyricistant/core-platform/platform/SystemThemeProvider';

declare global {
  interface Window {
    /**
     * Android doesn't support prefers-color-scheme and posting updates when it changes.
     * It uses this to update the renderer instead.
     *
     * @param dark Whether dark theme is enabled.
     */
    onNativeThemeChanged: (dark: boolean, palette?: SystemPalette) => void;
  }

  /**
   * Similar to [window.onNativeThemeChanged], Android doesn't provide a nice way of immediately getting the dark
   * theme value, so it'll instead provide this to the renderer.
   */
  const nativeThemeProvider:
    | { isDarkTheme: () => boolean; getPalette: () => string | null }
    | undefined;
}

export class MobileSystemThemeProvider implements SystemThemeProvider {
  public onChange = (
    listener: (theme: SystemTheme, palette?: SystemPalette) => void
  ) => {
    window.onNativeThemeChanged = (dark, palette) => {
      listener(dark ? SystemTheme.Dark : SystemTheme.Light, palette);
    };

    if (typeof nativeThemeProvider !== 'undefined') {
      const systemTheme = nativeThemeProvider.isDarkTheme()
        ? SystemTheme.Dark
        : SystemTheme.Light;

      listener(systemTheme, JSON.parse(nativeThemeProvider.getPalette()));
    } else {
      setColorSchemeListener(listener);
    }
  };
}
