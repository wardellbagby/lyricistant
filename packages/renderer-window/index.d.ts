import type { Analytics } from '@lyricistant/common/analytics/Analytics';
import type { PlatformDelegate } from '@lyricistant/common/Delegates';
import type { RendererLogger } from '@lyricistant/common/Logger';

declare global {
  interface Window {
    logger: RendererLogger;
    goatcounter?: Analytics;
    platformDelegate: PlatformDelegate;
  }
}
