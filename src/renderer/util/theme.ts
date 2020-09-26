import {
  createMuiTheme,
  responsiveFontSizes,
  Theme,
} from '@material-ui/core/styles';

export const getThemePalette = (useDarkTheme: boolean) => {
  return useDarkTheme ? darkThemePalette : lightThemePalette;
};
export const createTheme = (
  textSize: number | null,
  useDarkTheme: boolean
): Theme => {
  const themePalette = getThemePalette(useDarkTheme);

  return responsiveFontSizes(
    createMuiTheme({
      palette: {
        type: useDarkTheme ? 'dark' : 'light',
        action: {
          hover: themePalette.primary,
          hoverOpacity: 0,
        },
        primary: { main: themePalette.primary },
        background: {
          default: themePalette.background,
          paper: themePalette.surface,
        },
        text: {
          primary: themePalette.primaryText,
          secondary: themePalette.secondaryText,
        },
      },
      typography: textSize
        ? {
            fontSize: textSize,
          }
        : undefined,
    })
  );
};

const lightThemePalette = {
  primary: '#e0e0e0',
  background: '#fafafa',
  surface: '#fafafa',
  primaryText: '#212121',
  secondaryText: '#424242',
};

const darkThemePalette = {
  primary: '#343434',
  background: '#141414',
  surface: '#232323',
  primaryText: '#f8f8f8',
  secondaryText: '#bdbdbd',
};
