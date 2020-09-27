import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { Manager } from 'common/Manager';
import { TitleFormatter, UiConfigProvider } from 'common/ui/UiConfig';

export class UiConfigManager implements Manager {
  constructor(
    private rendererDelegate: RendererDelegate,
    private provideUiConfig: UiConfigProvider,
    private formatTitle: TitleFormatter,
    private fileManager: FileManager
  ) {}

  public register(): void {
    this.rendererDelegate.on('request-ui-config', () => {
      this.rendererDelegate.send('ui-config', this.provideUiConfig());
    });

    this.fileManager.addOnFileChangedListener((filename) => {
      this.rendererDelegate.send(
        'app-title-changed',
        this.formatTitle(filename)
      );
    });
  }
}
