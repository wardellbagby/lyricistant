import { PlatformDelegate } from '@common/Delegates';
import { DIContainer } from '@wessberg/di';

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
];

const appComponent: DIContainer = window.appComponent;
const platformDelegate: PlatformDelegate = window.platformDelegate;

export {
  APP_AUTHOR,
  APP_HOMEPAGE,
  APP_VERSION,
  appComponent,
  platformDelegate,
};
