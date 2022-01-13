import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileHistory } from '@lyricistant/common/history/FileHistory';

export class FileHistoryManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private fileHistory: FileHistory
  ) {}
  public register() {
    this.rendererDelegate.on('apply-file-history', (history) => {
      this.fileHistory.add(history.text);
      this.rendererDelegate.send('file-opened', undefined, history.text, false);
    });
    this.rendererDelegate.addRendererListenerSetListener('file-history', () => {
      this.rendererDelegate.send('file-history', this.getIncrementalHistory());
    });
  }

  private getIncrementalHistory = () =>
    this.fileHistory.getIncrementalParsedHistory();
}
