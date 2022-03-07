import { setupAnalytics } from '@lyricistant/renderer/analytics/setupAnalytics';
import { App } from '@lyricistant/renderer/app/App';
import { PlatformEventsReadyHandler } from '@lyricistant/renderer/app/PlatformEventsReadyHandler';
import { SupportedBrowserWarning } from '@lyricistant/renderer/app/SupportedBrowserWarning';
import { onPageLoaded, onThemeUpdated } from '@lyricistant/renderer/preload';
import { Themed } from '@lyricistant/renderer/theme/Themed';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';

const oldOnError = window.onerror;
window.onerror = (message, url, line, col, error) => {
  if (!logger) {
    // eslint-disable-next-line no-console
    console.error(message, { url, line, col }, error);
  } else {
    logger.error(JSON.stringify(message), { url, line, col }, error);
  }
  if (typeof message === 'string' && message.includes('ResizeObserver')) {
    // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
    return;
  }
  if (
    (!url || url.length === 0) &&
    typeof message === 'string' &&
    message.includes('Script error')
  ) {
    // Safari likes to throw out extra unnecessary errors.
    return;
  }
  if (oldOnError) {
    oldOnError(message, url, line, col, error);
  } else {
    alert(
      [
        'Sorry, Lyricistant has crashed! Please close this page and contact the developers.',
        'Continuing to use Lyricistant may result in undesired behavior.',
        '',
        `App version: ${process.env.APP_VERSION}`,
        `Homepage: ${process.env.APP_HOMEPAGE}`,
      ].join('\n')
    );
  }
};

if (!window.onunhandledrejection) {
  window.onunhandledrejection = (event) =>
    window.onerror(event, null, null, null, null);
}

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
        <SupportedBrowserWarning>
          <HashRouter hashType={'noslash'}>
            <App />
          </HashRouter>
        </SupportedBrowserWarning>
      </SnackbarProvider>
    </Themed>
  </PlatformEventsReadyHandler>,
  container
);
