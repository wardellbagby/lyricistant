import log from 'electron-log';
import { platformDelegate } from './Delegates';

process.on('loaded', () => {
  window.logger = log.functions;
  window.platformDelegate = platformDelegate;
});
