import { PlatformDelegate } from '@lyricistant/common/Delegates';
import { RendererLogger } from '@lyricistant/common/Logger';

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
];

const logger: RendererLogger = window.logger;
const platformDelegate: PlatformDelegate = window.platformDelegate;

export { APP_AUTHOR, APP_HOMEPAGE, APP_VERSION, logger, platformDelegate };
