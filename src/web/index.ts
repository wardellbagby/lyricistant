import { Managers } from 'common/Managers';
import { initializeComponent } from './AppComponent';
import { appComponent } from './Components';

initializeComponent(appComponent);

new Promise((resolve) => {
  appComponent.get<Managers>().forEach((manager) => manager.register());
  resolve();
})
  .then(() => import('../renderer/index'))
  .catch((reason) => {
    throw Error(`Could not load the renderer page: ${reason}`);
  });
