import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { onPageLoaded, onThemeUpdated } from '@lyricistant/renderer/preload';
import { setupAnalytics } from '@lyricistant/renderer/analytics/setupAnalytics';
import { AppRouter } from '@lyricistant/renderer/app/AppRouter';
import { DesktopOnly } from '@lyricistant/renderer/app/DesktopOnly';
import { PlatformEventsReadyHandler } from '@lyricistant/renderer/app/PlatformEventsReadyHandler';
import { Themed } from '@lyricistant/renderer/theme/Themed';
import { logger } from '@lyricistant/renderer/globals';
import { AppError } from '@lyricistant/renderer/app/AppError';

window.onerror = (message, url, line, col, error) => {
  if (!logger) {
    // eslint-disable-next-line no-console
    console.error(message, url, line, col, error);
  }
  logger.error(
    JSON.stringify(message) + '\n',
    `Url: ${url}\n`,
    `Line: ${line}\n`,
    `Column: ${col}\n`,
    error
  );
};

if (module.hot) {
  module.hot.accept();
}

setupAnalytics();
const container: HTMLElement = document.getElementById('app');

ReactDOM.render(
  <PlatformEventsReadyHandler>
    <Themed
      onThemeChanged={(palette) => {
        document.body.style.backgroundColor = palette.background;
        document.body.style.color = palette.primaryText;
        onThemeUpdated(palette);
      }}
      onThemeReady={() => {
        onPageLoaded();
        container.style.opacity = '100%';
      }}
    >
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <HashRouter hashType={'noslash'}>
          <ErrorBoundary
            fallbackRender={({ error }) => <AppError error={error} />}
          >
            <DesktopOnly>
              <AppRouter />
            </DesktopOnly>
          </ErrorBoundary>
        </HashRouter>
      </SnackbarProvider>
    </Themed>
  </PlatformEventsReadyHandler>,
  container
);
