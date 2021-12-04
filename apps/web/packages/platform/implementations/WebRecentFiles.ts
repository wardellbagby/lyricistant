import { RecentFiles } from '@lyricistant/common/files/RecentFiles';

export class WebRecentFiles implements RecentFiles {
  public getRecentFiles = (): string[] => [];

  public setRecentFiles = (): void => undefined;
}
