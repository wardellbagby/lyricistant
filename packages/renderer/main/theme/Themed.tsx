import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import { createTheme } from '@lyricistant/renderer/theme';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import {
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { logger } from '@lyricistant/renderer/globals';

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
    onThemeChanged: (background: string, foreground: string) => void;
  }>
> = ({ onThemeChanged, children }) => {
  const [theme, setTheme] = useState(createTheme(null));
  useEffect(
    () =>
      onThemeChanged(
        theme.palette.background.default,
        theme.palette.getContrastText(theme.palette.background.default)
      ),
    [theme, onThemeChanged]
  );

  useChannel(
    'theme-updated',
    (themeData) => {
      const appTheme = createTheme(themeData);
      setTheme(appTheme);
      loadFont(themeData).catch((reason) =>
        logger.warn('Failed to load fonts', reason)
      );
    },
    [setTheme]
  );

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CssBaseline>
  );
};
