import {
  createTheme as createMuiTheme,
  responsiveFontSizes,
  Theme,
} from '@mui/material';
import {
  ColorScheme,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { Palette } from '@lyricistant/common/theme/SystemTheme';

export const getThemePalette = (
  themeData?: ThemeData
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
    })
  );
};

const lightThemePalette: Palette = {
  primary: '#0388d1',
  background: '#fafafa',
  surface: '#E0E0E0',
  primaryText: '#212121',
  secondaryText: '#424242',
};

const darkThemePalette: Palette = {
  primary: '#2ab6f6',
  background: '#141414',
  surface: '#232323',
  primaryText: '#f8f8f8',
  secondaryText: '#bdbdbd',
};
