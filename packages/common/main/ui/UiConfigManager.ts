import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { Manager } from '@lyricistant/common/Manager';
import { TitleFormatter, UiConfigProvider } from './UiConfig';

export class UiConfigManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private provideUiConfig: UiConfigProvider,
    private formatTitle: TitleFormatter,
    private fileManager: FileManager
  ) {}

  public register(): void {
    this.rendererDelegate.on('request-ui-config', () => {
      this.rendererDelegate.send('ui-config', this.provideUiConfig());
    });
    this.rendererDelegate.addRendererListenerSetListener('ui-config', () => {
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
