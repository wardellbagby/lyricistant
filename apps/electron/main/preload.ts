import { platformDelegate } from './Delegates';
import { rendererComponent } from './RendererComponent';

process.on('loaded', () => {
  window.appComponent = rendererComponent;
  window.platformDelegate = platformDelegate;
});
