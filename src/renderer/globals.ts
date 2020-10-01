import { DIContainer } from '@wessberg/di';

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
  // @ts-ignore
  window.appComponent,
];

// @ts-ignore
const appComponent: DIContainer = window.appComponent;

export { APP_AUTHOR, APP_HOMEPAGE, APP_VERSION, appComponent };
