import { setupAnalytics } from '@lyricistant/renderer/analytics/setupAnalytics';
import { App } from '@lyricistant/renderer/app/App';
import { PlatformEventsReadyHandler } from '@lyricistant/renderer/app/PlatformEventsReadyHandler';
import { SupportedBrowserWarning } from '@lyricistant/renderer/app/SupportedBrowserWarning';
import { setWindowErrorHandler } from '@lyricistant/renderer/errors/ErrorHandlers';
import { onPageLoaded, onThemeUpdated } from '@lyricistant/renderer/preload';
import { Themed } from '@lyricistant/renderer/theme/Themed';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';

if (module.hot) {
  module.hot.accept();
}

setWindowErrorHandler();
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
