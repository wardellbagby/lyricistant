import React, { PropsWithChildren, ReactElement } from 'react';
import { SnackbarProvider } from 'notistack';
import { render as realRender, RenderOptions } from '@testing-library/react';
import { Themed } from '@lyricistant/renderer/theme/Themed';

const DefaultWrapper = ({ children }: PropsWithChildren<unknown>) => (
  <Themed onThemeChanged={() => undefined} onThemeReady={() => undefined}>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      {children}
    </SnackbarProvider>
  </Themed>
);

export const render = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>
) => realRender(ui, { ...options, wrapper: DefaultWrapper });

export const wait = async (timeout: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
