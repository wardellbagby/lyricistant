import { RecentFiles as IRecentFiles } from 'common/files/RecentFiles';
import { app } from 'electron';
import { existsSync } from 'fs';
import { readFileSync, writeFile } from 'original-fs';

class ElectronRecentFiles implements IRecentFiles {
  private readonly recentFilesFilePath = `${app.getPath(
    'userData'
  )}/recent_files.json`;

  private cachedRecentFiles: string[];

  public getRecentFiles = (): string[] => {
    if (!this.cachedRecentFiles) {
      if (existsSync(this.recentFilesFilePath)) {
        this.cachedRecentFiles = JSON.parse(
          readFileSync(this.recentFilesFilePath, 'utf8')
        );
      } else {
        this.cachedRecentFiles = [];
      }
    }

    return [...this.cachedRecentFiles];
  };

  public setRecentFiles = (recentFiles: string[]) => {
    this.cachedRecentFiles = recentFiles;
    writeFile(
      this.recentFilesFilePath,
      JSON.stringify(recentFiles),
      () => undefined
    );
  };
}

export type RecentFiles = ElectronRecentFiles;
export const RecentFiles = ElectronRecentFiles;
