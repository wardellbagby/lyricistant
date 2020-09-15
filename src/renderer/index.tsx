import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';

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
  <App
    onShouldUpdateBackground={(newBackground: string) => {
      container.style.backgroundColor = newBackground;
    }}
  />,
  container
);
