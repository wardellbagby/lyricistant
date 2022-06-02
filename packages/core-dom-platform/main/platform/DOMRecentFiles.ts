import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';

const recentFilesKey = 'recent_files';

export class DOMRecentFiles implements RecentFiles {
  public getRecentFiles = (): string[] => {
    const recentFiles = localStorage.getItem(recentFilesKey);
    if (recentFiles) {
      return JSON.parse(recentFiles);
    } else {
      return [];
    }
  };

  public setRecentFiles = (recentFiles: string[]) => {
    localStorage.setItem(recentFilesKey, JSON.stringify(recentFiles));
  };
}
