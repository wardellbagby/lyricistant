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

  public addRecentFile = (filePath: string) => {
    const recentFiles = this.getRecentFiles();
    recentFiles.unshift(filePath);
    if (new Set(recentFiles).size > 10) {
      recentFiles.pop();
    }
    localStorage.setItem(
      recentFilesKey,
      JSON.stringify([...new Set(recentFiles)])
    );
  };
}

export type RecentFiles = WebRecentFiles;
export const RecentFiles = WebRecentFiles;
