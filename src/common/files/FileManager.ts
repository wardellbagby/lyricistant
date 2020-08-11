import { FileData } from 'common/files/Files';
import { Manager } from 'common/Manager';
import { Files } from 'platform/Files';
import { RecentFiles } from 'platform/RecentFiles';

export class FileManager extends Manager {
  private readonly files: Files = new Files();
  private readonly recentFiles = new RecentFiles();

  private currentFilePath: string | undefined = undefined;
  private newFileListener: (recentFiles: string[]) => void = undefined;

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('open-file', this.onOpenFile);
    this.rendererDelegate.on('save-file', this.onSaveFile);
  }

  public onNewFile(listener: (recentFiles: string[]) => void) {
    this.newFileListener = listener;
  }

  private onRendererReady = () => {
    this.rendererDelegate.send('new-file-created');
    if (this.newFileListener) {
      this.newFileListener(this.recentFiles.getRecentFiles());
    }
  };

  private onOpenFile = async () => {
    try {
      const fileData = await this.files.openFile();
      if (fileData) {
        this.currentFilePath = fileData.filePath;
        this.rendererDelegate.send(
          'file-opened',
          undefined,
          fileData.filePath,
          fileData.data
        );
        this.recentFiles.addRecentFile(this.currentFilePath);
        if (this.newFileListener) {
          this.newFileListener(this.recentFiles.getRecentFiles());
        }
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined);
    }
  };

  private onSaveFile = async (data: string) => {
    await this.files.saveFile(new FileData(this.currentFilePath, data));
  };
}
