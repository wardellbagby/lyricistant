import {
  CssBaseline,
  StyledEngineProvider,
  Theme,
  ThemeProvider,
} from '@mui/material';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import { createTheme, getThemePalette } from '@lyricistant/renderer/theme';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import {
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { Palette } from '@lyricistant/common/theme/SystemTheme';

declare module '@mui/styles/defaultTheme' {
  // Needed so that makeStyles has the right typings for theme.
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const loadFont = async (themeData?: ThemeData) => {
  switch (themeData?.font) {
    case Font.Roboto:
      return import('@fontsource/roboto/latin-400.css');
    default:
      return import('@fontsource/roboto-mono/latin-400.css');
  }
};
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
      setTheme(appTheme);
      setPalette(getThemePalette(themeData).palette);

      loadFont(themeData)
        .then(onThemeReady)
        .catch((reason) => {
          onThemeReady();
          logger.warn('Failed to load fonts', reason);
        });
    },
    [setTheme]
  );

  useEffect(() => {
    if (palette) {
      onThemeChanged(palette);
    }
  }, [palette, onThemeChanged]);

  return (
    <CssBaseline>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </StyledEngineProvider>
    </CssBaseline>
  );
};
