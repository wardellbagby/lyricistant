import {
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { Palette } from '@lyricistant/common/theme/SystemTheme';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { createTheme, getThemePalette } from '@lyricistant/renderer/theme';
import {
  CssBaseline,
  GlobalStyles,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';

const loadFont = async (themeData?: ThemeData) => {
  switch (themeData?.font) {
    case Font.Roboto:
      return import('@fontsource/roboto/latin-400.css');
    default:
      return import('@fontsource/roboto-mono/latin-400.css');
  }
};
/**
 * A component that provides a MUI theme to all of its children, handles loading
 * fonts, and sets a standard CSS baseline.
 *
 * @param onThemeChanged Invoked when the theme changes.
 * @param onThemeReady Invoked when a theme has been successfully created.
 * @param children The children of this component.
 */
export const Themed: FunctionComponent<
  PropsWithChildren<{
    onThemeChanged: (palette: Palette) => void;
    onThemeReady: () => void;
  }>
> = ({ onThemeChanged, onThemeReady, children }) => {
  const [theme, setTheme] = useState(createTheme());
  const [palette, setPalette] = useState<Palette | null>(null);

  useChannel(
    'theme-updated',
    (themeData) => {
      const appTheme = createTheme(themeData);
      setPalette(getThemePalette(themeData).palette);

      loadFont(themeData)
        .then(() => {
          setTheme(appTheme);
          onThemeReady();
        })
        .catch((reason) => {
          setTheme(appTheme);
          onThemeReady();
          logger.warn('Failed to load fonts', reason);
        });
    },
    [setTheme],
  );

  useEffect(() => {
    if (palette) {
      onThemeChanged(palette);
    }
  }, [palette, onThemeChanged]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <GlobalStyles
          styles={{
            '.random-button': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.background.default,
            },
          }}
        />
        <CssBaseline>{children} </CssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
