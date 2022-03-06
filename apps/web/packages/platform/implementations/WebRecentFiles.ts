import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';

export class WebRecentFiles implements RecentFiles {
  public getRecentFiles = (): string[] => [];

  public setRecentFiles = (): void => undefined;
}
