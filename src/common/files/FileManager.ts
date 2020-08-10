import { FileData } from 'common/files/Files';
import { Manager } from 'common/Manager';
import { Files } from 'platform/Files';
export class FileManager extends Manager {
  private currentFilePath: string | undefined = undefined;
  private files: Files = new Files();

  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
    this.rendererDelegate.on('open-file', this.onOpenFile);
    this.rendererDelegate.on('save-file', this.onSaveFile);
  }

  private onRendererReady = () => {
    this.rendererDelegate.send('new-file-created');
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
      }
    } catch (e) {
      this.rendererDelegate.send('file-opened', e, undefined, undefined);
    }
  };

  private onSaveFile = async (data: string) => {
    await this.files.saveFile(new FileData(this.currentFilePath, data));
  };
}
