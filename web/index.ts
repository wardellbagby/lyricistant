import { Managers } from 'common/main/Managers';
import { initializeComponent } from './AppComponent';
import { appComponent } from './Components';

initializeComponent(appComponent);
// @ts-ignore
window.appComponent = appComponent;

new Promise((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(async () => {
    appComponent.get<Logger>().info('Platform information', {
      appPlatform: 'Web',
      version:
        (await import('../renderer/main/globals')).APP_VERSION ?? 'Error',
      userAgent: navigator.userAgent,
    });
  })
  .then(() => import('../renderer/main'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
