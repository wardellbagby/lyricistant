import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { App } from './components/App';
import { PlatformEventsReadyHandler } from './components/PlatformEventsReadyHandler';
import { Themed } from './components/Themed';
import { appComponent } from './globals';

const logger = appComponent.get<Logger>();
window.onerror = (message, url, line, col, error) => {
  logger.error(
    JSON.stringify(message) + '\n',
    `Url: ${url}\n`,
    `Line: ${line}\n`,
    `Column: ${col}\n`,
    error
  );
};

const container: HTMLElement = document.getElementById('app');

document.documentElement.style.height = '100%';
document.documentElement.style.width = '100%';
document.body.style.height = '100%';
document.body.style.width = '100%';
// @ts-ignore
document.body.style['overscroll-behavior'] = 'none';
container.style.height = '100%';
container.style.width = '100%';

if (module.hot) {
  module.hot.accept();
}

ReactDOM.render(
  <PlatformEventsReadyHandler>
    <Themed
      onBackgroundChanged={(background: string) => {
        container.style.backgroundColor = background;
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
          <App />
        </HashRouter>
      </SnackbarProvider>
    </Themed>
  </PlatformEventsReadyHandler>,
  container
);
