import type { Analytics } from '@lyricistant/common/analytics/Analytics';
import type { PlatformDelegate } from '@lyricistant/common/Delegates';
import type { Logger } from '@lyricistant/common/Logger';

declare global {
  const logger: Logger;
  const goatcounter: Analytics | undefined;
  const platformDelegate: PlatformDelegate;

  interface Window {
    logger: Logger;
    goatcounter: Analytics | undefined;
    platformDelegate: PlatformDelegate;
  }
}
