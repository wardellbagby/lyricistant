import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';

const container: HTMLElement = document.getElementById('app');

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
