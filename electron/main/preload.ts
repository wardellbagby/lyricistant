import { remote } from 'electron';

process.on('loaded', () => {
  // @ts-ignore
  global.appComponent = remote.getGlobal('appComponent');
});
