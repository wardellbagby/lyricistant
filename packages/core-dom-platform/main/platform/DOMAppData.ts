import { Serializable } from '@lyricistant/common/Serializable';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';

export class DOMAppData implements AppData {
  public set = (key: string, data: Serializable) => {
    localStorage.setItem(key, JSON.stringify(data));
  };
  public get = async (key: string) => {
    if (!(await this.exists(key))) {
      return undefined;
    }
    return JSON.parse(localStorage.getItem(key));
  };

  public exists = async (key: string) => !!localStorage.getItem(key);
  public delete = (key: string): void => {
    localStorage.removeItem(key);
  };
}
