import {
  createMuiTheme,
  responsiveFontSizes,
  Theme
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
          hoverOpacity: 0
        },
        primary: { main: themePalette.primary },
        background: {
          default: themePalette.primaryBackground,
          paper: themePalette.secondaryBackground
        },
        text: {
          primary: themePalette.primaryText,
          secondary: themePalette.secondaryText
        }
      },
      typography: textSize
        ? {
            fontSize: textSize
          }
        : undefined
    })
  );
};

const lightThemePalette = {
  primary: '#9e9e9e',
  primaryBackground: '#fafafa',
  secondaryBackground: '#e0e0e0',
  primaryText: '#212121',
  secondaryText: '#424242'
};

const darkThemePalette = {
  primary: '#616161',
  primaryBackground: '#141414',
  secondaryBackground: '#232323',
  primaryText: '#f8f8f8',
  secondaryText: '#bdbdbd'
};
