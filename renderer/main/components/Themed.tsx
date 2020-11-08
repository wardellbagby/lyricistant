import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import React, { FunctionComponent, PropsWithChildren, useState } from 'react';
import 'typeface-roboto';
import { useChannel } from '../hooks/useChannel';
import { createTheme } from '../util/theme';

export const Themed: FunctionComponent<PropsWithChildren<{
  onBackgroundChanged: (background: string) => void;
}>> = ({ onBackgroundChanged, children }) => {
  const [theme, setTheme] = useState(createTheme(null, true));

  useChannel('dark-mode-toggled', (textSize, useDarkMode) => {
    const appTheme = createTheme(textSize, useDarkMode);
    setTheme(appTheme);
    onBackgroundChanged(appTheme.palette.background.default);
  });

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CssBaseline>
  );
};
