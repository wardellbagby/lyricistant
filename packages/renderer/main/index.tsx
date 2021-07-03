import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { setupAnalytics } from './analytics/setupAnalytics';
import { AppRouter } from './components/AppRouter';
import { DesktopOnly } from './components/DesktopOnly';
import { PlatformEventsReadyHandler } from './components/PlatformEventsReadyHandler';
import { Themed } from './components/Themed';
import { logger } from './globals';
import { AppError } from './components/AppError';

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
const loadingContainer = document.getElementById('loading-container');

ReactDOM.render(
  <PlatformEventsReadyHandler>
    <Themed
      onThemeChanged={(background: string, foreground: string) => {
        document.body.style.backgroundColor = background;
        document.body.style.color = foreground;
        if (loadingContainer.parentNode) {
          loadingContainer.style.backgroundColor = background;
          loadingContainer.style.color = foreground;
        }
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
  container,
  () => {
    loadingContainer.style.opacity = '0%';
    container.style.opacity = '100%';
    setTimeout(() => loadingContainer.remove(), 500);
  }
);
