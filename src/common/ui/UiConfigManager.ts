import { FileManager } from 'common/files/FileManager';
import { Manager } from 'common/Manager';
import { getCommonManager } from 'common/Managers';
import { formatTitle, provideUiConfig } from 'platform/UiConfigProvider';

export class UiConfigManager extends Manager {
  public register(): void {
    this.rendererDelegate.on('request-ui-config', () => {
      this.rendererDelegate.send('ui-config', provideUiConfig());
    });

    getCommonManager(FileManager).addOnFileChangedListener((filename) => {
      this.rendererDelegate.send('app-title-changed', formatTitle(filename));
    });
  }
}
