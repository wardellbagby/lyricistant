import { RecentFiles as IRecentFiles } from 'common/files/RecentFiles';

const recentFilesKey = 'recent_files';

class WebRecentFiles implements IRecentFiles {
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

export type RecentFiles = WebRecentFiles;
export const RecentFiles = WebRecentFiles;
