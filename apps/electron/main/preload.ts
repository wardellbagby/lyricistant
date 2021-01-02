import { remote } from 'electron';
import { platformDelegate } from './Delegates';

process.on('loaded', () => {
  window.appComponent = remote.getGlobal('appComponent');
  window.platformDelegate = platformDelegate;
});
