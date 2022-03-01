import log from 'electron-log';
import { platformDelegate } from '@electron-delegates/Delegates';
import { isDevelopment, isUnderTest } from '@lyricistant/common/BuildModes';

process.on('loaded', () => {
  window.logger = log.functions;
  window.platformDelegate = platformDelegate;
  if (isDevelopment || isUnderTest) {
    import('react-devtools').catch((reason) =>
      log.warn("Couldn't load React DevTools", reason)
    );
  }
});
