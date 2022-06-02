import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { Manager } from '@lyricistant/common-platform/Manager';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';
import { RendererDelegate } from '@lyricistant/common/Delegates';

export class UiConfigManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private provideUiConfig: UiConfigProvider,
    private formatTitle: TitleFormatter,
    private fileManager: FileManager
  ) {}

  public register(): void {
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
