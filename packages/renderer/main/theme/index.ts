import {
  ColorScheme,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { Palette } from '@lyricistant/common/theme/SystemTheme';
import {
  createTheme as createMuiTheme,
  responsiveFontSizes,
  Theme,
} from '@mui/material';

/**
 * Get a theme palette based on the given theme data.
 *
 * @param themeData The optional theme data to generate a palette for.
 */
export const getThemePalette = (
  themeData?: ThemeData,
): { palette: Palette; isDark: boolean } => {
  const useDarkTheme = !themeData || themeData.colorScheme === ColorScheme.Dark;

  return {
    palette: {
      ...(useDarkTheme ? darkThemePalette : lightThemePalette),
      ...themeData?.systemPalette,
    },
    isDark: useDarkTheme,
  };
};

/**
 * Create a MUI theme from theme data.
 *
 * @param themeData The theme data used for generating the MUI theme.
 */
export const createTheme = (themeData?: ThemeData): Theme => {
  const { palette, isDark } = getThemePalette(themeData);

  return responsiveFontSizes(
    createMuiTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        action: {
          hover: palette.primary,
          hoverOpacity: 0,
        },
        primary: {
          main: palette.primary,
        },
        background: {
          default: palette.background,
          paper: palette.surface,
        },
        text: {
          primary: palette.primaryText,
          secondary: palette.secondaryText,
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: { root: { backgroundImage: 'unset' } },
        },
      },
      typography: themeData?.textSize
        ? {
            fontSize: themeData.textSize,
          }
        : undefined,
    }),
  );
};

const lightThemePalette: Palette = {
  primary: '#2c9a35',
  background: '#faf9f7',
  surface: '#efeae1',
  primaryText: '#212121',
  secondaryText: '#424242',
};

const darkThemePalette: Palette = {
  primary: '#f2b21c',
  background: '#141414',
  surface: '#232323',
  primaryText: '#f8f8f8',
  secondaryText: '#bdbdbd',
};
