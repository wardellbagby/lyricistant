import { platformDelegate } from '@electron-delegates/Delegates';
import log from 'electron-log';

process.on('loaded', () => {
  window.logger = log.functions;
  window.platformDelegate = platformDelegate;
});
