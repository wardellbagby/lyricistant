import { AppData } from '@lyricistant/common-platform/files/AppData';
import { renderer } from '@web-platform/renderer';

export class WebAppData implements AppData {
  public set = (key: string, data: string | null) => {
    renderer
      .getLocalStorage()
      .then((storage) => storage.setItem(key, JSON.stringify(data)));
  };
  public get = async (key: string) => {
    if (!(await this.exists(key))) {
      return '';
    }
    const storage = await renderer.getLocalStorage();
    return JSON.parse(await storage.getItem(key));
  };

  public exists = async (key: string) => {
    const storage = await renderer.getLocalStorage();
    return !!(await storage.getItem(key));
  };
  public delete = (key: string): void => {
    renderer.getLocalStorage().then((storage) => storage.removeItem(key));
  };
}
