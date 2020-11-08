import { RendererDelegate } from '../Delegates';
import { FileManager } from '../files/FileManager';
import { Manager } from '../Manager';
import { TitleFormatter, UiConfigProvider } from './UiConfig';

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
