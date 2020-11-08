import { DIContainer } from '@wessberg/di';
import { PlatformDelegate } from '@common/Delegates';

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
  window.appComponent,
  window.platformDelegate,
];

declare global {
  interface Window {
    appComponent: DIContainer;
    goatcounter?: Analytics;
    platformDelegate: PlatformDelegate;
  }
}

const appComponent: DIContainer = window.appComponent;
const platformDelegate: PlatformDelegate = window.platformDelegate;

export {
  APP_AUTHOR,
  APP_HOMEPAGE,
  APP_VERSION,
  appComponent,
  platformDelegate,
};
