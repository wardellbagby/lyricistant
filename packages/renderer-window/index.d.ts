import type { Analytics } from '@lyricistant/common/analytics/Analytics';
import type { PlatformDelegate } from '@lyricistant/common/Delegates';
import type { RendererLogger } from '@lyricistant/common/Logger';

declare global {
  const logger: RendererLogger;
  const goatcounter: Analytics | undefined;
  const platformDelegate: PlatformDelegate;

  interface Window {
    logger: RendererLogger;
    goatcounter: Analytics | undefined;
    platformDelegate: PlatformDelegate;
  }
}
