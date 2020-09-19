import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import { PlatformEventsReadyHandler } from './components/PlatformEventsReadyHandler';
import { Themed } from './components/Themed';

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
          horizontal: 'right'
        }}
      >
        <App />
      </SnackbarProvider>
    </Themed>
  </PlatformEventsReadyHandler>,
  container
);
