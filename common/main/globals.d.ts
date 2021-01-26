import type { Analytics } from './analytics/Analytics';
import type { PlatformDelegate } from './Delegates';
import { Logger } from './Logger';

declare type RendererLogger = Omit<Logger, 'save'>;
declare global {
  interface Window {
    logger: RendererLogger;
    goatcounter?: Analytics;
    platformDelegate: PlatformDelegate;
  }
}
