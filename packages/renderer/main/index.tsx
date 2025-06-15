import { setupAnalytics } from '@lyricistant/renderer/analytics/setupAnalytics';
import { App } from '@lyricistant/renderer/app/App';
import { PlatformEventsReadyHandler } from '@lyricistant/renderer/app/PlatformEventsReadyHandler';
import { SupportedBrowserWarning } from '@lyricistant/renderer/app/SupportedBrowserWarning';
import { setWindowErrorHandler } from '@lyricistant/renderer/errors/ErrorHandlers';
import { onPageLoaded, onThemeUpdated } from '@lyricistant/renderer/preload';
import { Themed } from '@lyricistant/renderer/theme/Themed';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router, BaseLocationHook } from 'wouter';
import { useLocationProperty, navigate } from 'wouter/use-location';

if (module.hot) {
  module.hot.accept();
}

setWindowErrorHandler();
setupAnalytics();
const container: HTMLElement = document.getElementById('app');
const root = ReactDOM.createRoot(container);

const hashLocation = () => window.location.hash.replace(/^#/, '') || '/';
const hashNavigate = (to: string, ...args: unknown[]) => {
  if (to) {
    navigate('#' + to, ...args);
  } else {
    navigate('/', ...args);
  }
  window.history.replaceState({ internal: true }, null, null);
};

const useHashLocation: BaseLocationHook = () => {
  const location = useLocationProperty(hashLocation);
  return [location, hashNavigate];
};

root.render(
  <React.StrictMode>
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
            <Router hook={useHashLocation}>
              <App />
            </Router>
          </SupportedBrowserWarning>
        </SnackbarProvider>
      </Themed>
    </PlatformEventsReadyHandler>
  </React.StrictMode>,
);
