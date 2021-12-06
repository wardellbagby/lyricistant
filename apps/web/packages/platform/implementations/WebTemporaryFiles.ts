import { renderer } from '@web-platform/renderer';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';

export class WebTemporaryFiles implements TemporaryFiles {
  private temporaryFileKey = 'temporary_file';
  public set = (data: string | null) => {
    renderer
      .getLocalStorage()
      .then((storage) =>
        storage.setItem(this.temporaryFileKey, JSON.stringify(data))
      );
  };
  public get = async () => {
    if (!(await this.exists())) {
      return '';
    }
    const storage = await renderer.getLocalStorage();
    return JSON.parse(await storage.getItem(this.temporaryFileKey));
  };

  public exists = async () => {
    const storage = await renderer.getLocalStorage();
    return !!(await storage.getItem(this.temporaryFileKey));
  };
  public delete = (): void => {
    renderer
      .getLocalStorage()
      .then((storage) => storage.removeItem(this.temporaryFileKey));
  };
}
