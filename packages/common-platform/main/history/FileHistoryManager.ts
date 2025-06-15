import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { getEditorText, Manager } from '@lyricistant/common-platform/Manager';

export class FileHistoryManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private fileHistory: FileHistory,
  ) {}
  public register() {
    this.rendererDelegate.on('apply-file-history', (history) => {
      this.fileHistory.add(history.text);
      this.rendererDelegate.send('file-opened', undefined, history.text, false);
    });
    this.rendererDelegate.addRendererListenerSetListener(
      'file-history',
      async () => {
        this.rendererDelegate.send(
          'file-history',
          await this.getIncrementalHistory(),
        );
      },
    );
  }

  private getIncrementalHistory = async () =>
    this.fileHistory.getIncrementalParsedHistory({
      includeChunks: { base: await getEditorText(this.rendererDelegate) },
    }) ?? [];
}
