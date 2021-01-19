import type { Analytics } from './analytics/Analytics';
import type { PlatformDelegate } from './Delegates';
import { Logger } from './Logger';

declare global {
  interface Window {
    logger: Omit<Logger, 'save'>;
    goatcounter?: Analytics;
    platformDelegate: PlatformDelegate;
  }
}
