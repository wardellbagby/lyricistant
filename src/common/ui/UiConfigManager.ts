import { Manager } from 'common/Manager';
import { provideUiConfig } from 'platform/UiConfigProvider';

export class UiConfigManager extends Manager {
  public register(): void {
    this.rendererDelegate.on('request-ui-config', () => {
      this.rendererDelegate.send('ui-config', provideUiConfig());
    });
  }
}
