import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import { createTheme } from '@lyricistant/renderer/theme';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';

export const Themed: FunctionComponent<
  PropsWithChildren<{
    onThemeChanged: (background: string, foreground: string) => void;
  }>
> = ({ onThemeChanged, children }) => {
  const [theme, setTheme] = useState(createTheme(null, true));
  useEffect(
    () =>
      onThemeChanged(
        theme.palette.background.default,
        theme.palette.getContrastText(theme.palette.background.default)
      ),
    [theme, onThemeChanged]
  );

  useChannel(
    'dark-mode-toggled',
    (textSize, useDarkMode) => {
      const appTheme = createTheme(textSize, useDarkMode);
      setTheme(appTheme);
    },
    [setTheme]
  );

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CssBaseline>
  );
};
