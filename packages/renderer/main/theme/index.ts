import {
  createTheme as createMuiTheme,
  responsiveFontSizes,
  Theme,
} from '@material-ui/core';
import {
  ColorScheme,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';

export const getThemePalette = (useDarkTheme: boolean) =>
  useDarkTheme ? darkThemePalette : lightThemePalette;

export const createTheme = (themeData?: ThemeData): Theme => {
  const useDarkTheme = themeData?.colorScheme === ColorScheme.Dark ?? true;
  const themePalette = getThemePalette(useDarkTheme);

  return responsiveFontSizes(
    createMuiTheme({
      palette: {
        type: useDarkTheme ? 'dark' : 'light',
        action: {
          hover: themePalette.primary,
          hoverOpacity: 0,
        },
        primary: {
          main: themePalette.primary,
        },
        background: {
          default: themePalette.background,
          paper: themePalette.surface,
        },
        text: {
          primary: themePalette.primaryText,
          secondary: themePalette.secondaryText,
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

const lightThemePalette = {
  primary: '#0388d1',
  background: '#fafafa',
  surface: '#E0E0E0',
  primaryText: '#212121',
  secondaryText: '#424242',
};

const darkThemePalette = {
  primary: '#2ab6f6',
  background: '#141414',
  surface: '#232323',
  primaryText: '#f8f8f8',
  secondaryText: '#bdbdbd',
};
