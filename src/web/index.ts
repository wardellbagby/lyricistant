import { Managers } from 'common/Managers';
import { appComponent } from 'Components';
import { initializeComponent } from './AppComponent';

initializeComponent(appComponent);

new Promise((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(() => import('../renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
