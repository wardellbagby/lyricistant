import { RecentFiles as IRecentFiles } from 'common/files/RecentFiles';
import { app } from 'electron';
import { readFileSync, writeFile } from 'original-fs';

class ElectronRecentFiles implements IRecentFiles {
  private readonly recentFilesFilePath = `${app.getPath(
    'userData'
  )}/recent_files.json`;

  private cachedRecentFiles: string[];

  public getRecentFiles = (): string[] => {
    if (!this.cachedRecentFiles) {
      this.cachedRecentFiles = JSON.parse(
        readFileSync(this.recentFilesFilePath, 'utf8')
      );
    }

    return this.cachedRecentFiles;
  };
  public addRecentFile = (filePath: string) => {
    const recentFiles = this.getRecentFiles();
    recentFiles.unshift(filePath);
    writeFile(
      this.recentFilesFilePath,
      JSON.stringify(recentFiles),
      () => undefined
    );
  };
}

export type RecentFiles = ElectronRecentFiles;
export const RecentFiles = ElectronRecentFiles;
