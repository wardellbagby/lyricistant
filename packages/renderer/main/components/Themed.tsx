import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import React, { FunctionComponent, PropsWithChildren, useState } from 'react';
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import { useChannel } from '../hooks/useChannel';
import { createTheme } from '../util/theme';

export const Themed: FunctionComponent<PropsWithChildren<{
  onThemeChanged: (background: string, foreground: string) => void;
}>> = ({ onThemeChanged, children }) => {
  const [theme, setTheme] = useState(createTheme(null, true));

  useChannel('dark-mode-toggled', (textSize, useDarkMode) => {
    const appTheme = createTheme(textSize, useDarkMode);
    setTheme(appTheme);
    onThemeChanged(
      appTheme.palette.background.default,
      appTheme.palette.getContrastText(appTheme.palette.background.default)
    );
  });

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CssBaseline>
  );
};
