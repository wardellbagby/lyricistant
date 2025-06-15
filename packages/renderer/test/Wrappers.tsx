import { Themed } from '@lyricistant/renderer/theme/Themed';
import {
  MatcherFunction,
  render as realRender,
  RenderOptions,
} from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React, { PropsWithChildren, ReactElement } from 'react';

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
  options?: Omit<RenderOptions, 'queries'>,
) => realRender(ui, { ...options, wrapper: DefaultWrapper });

export const wait = async (timeout: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));

/**
 * A function that returns a text matcher to find {@link text} that ignores any
 * nested elements. I.e., this will match the string "Hello" to a DOM that looks
 * like <div>He<b>llo</b></dib>.
 *
 * @param text The text to match.
 */
export const nestedElementTextMatcher: (text: string) => MatcherFunction =
  (text) => (_, element) => {
    const isRootMatch = element.textContent === text;
    const hasChildMatch = Array.from(element?.children || []).some(
      (child) => child.textContent === text,
    );

    return isRootMatch && !hasChildMatch;
  };
