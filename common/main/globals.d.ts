import type { DIContainer } from '@wessberg/di';
import type { Analytics } from './analytics/Analytics';
import type { PlatformDelegate } from './Delegates';

declare global {
  interface Window {
    appComponent: DIContainer;
    goatcounter?: Analytics;
    platformDelegate: PlatformDelegate;
  }
}
