import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';

export class MobileTemporaryFiles implements TemporaryFiles {
  private temporaryFileKey = 'temporary_file';
  public set = (data: string | null) => {
    localStorage.setItem(this.temporaryFileKey, JSON.stringify(data));
  };
  public get = async () => {
    if (!this.exists()) {
      return '';
    }
    return JSON.parse(localStorage.getItem(this.temporaryFileKey));
  };

  public exists = () => !!localStorage.getItem(this.temporaryFileKey);
  public delete = (): void => {
    localStorage.removeItem(this.temporaryFileKey);
  };
}
