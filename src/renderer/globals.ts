import { DIContainer } from '@wessberg/di';

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
  window.appComponent,
];

declare global {
  interface Window {
    appComponent: DIContainer;
    goatcounter?: Analytics;
  }
}

const appComponent: DIContainer = window.appComponent;

export { APP_AUTHOR, APP_HOMEPAGE, APP_VERSION, appComponent };
