import React, { PropsWithChildren, ReactElement } from 'react';
import { SnackbarProvider } from 'notistack';
import { render as realRender, RenderOptions } from '@testing-library/react';

const SnackbarWrapper = ({ children }: PropsWithChildren<unknown>) => (
  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
  >
    {children}
  </SnackbarProvider>
);

export const snackbarWrappedRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>
) => realRender(ui, { ...options, wrapper: SnackbarWrapper });
