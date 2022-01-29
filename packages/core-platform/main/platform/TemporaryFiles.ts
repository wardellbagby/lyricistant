import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';

export class CoreTemporaryFiles implements TemporaryFiles {
  public set = (key: string, data: string | null) => {
    localStorage.setItem(key, JSON.stringify(data));
  };
  public get = async (key: string) => {
    if (!(await this.exists(key))) {
      return '';
    }
    return JSON.parse(localStorage.getItem(key));
  };

  public exists = async (key: string) => !!localStorage.getItem(key);
  public delete = (key: string): void => {
    localStorage.removeItem(key);
  };
}
