import path from 'path';
import { RecentFiles as IRecentFiles } from '@common/files/RecentFiles';
import { Logger } from '@common/Logger';
import { FileSystem } from '../wrappers/FileSystem';

export class ElectronRecentFiles implements IRecentFiles {
  private readonly recentFilesFilePath = path.resolve(
    this.fs.getDataDirectory('userData'),
    'recent_files.json'
  );

  private cachedRecentFiles: string[];

  public constructor(private fs: FileSystem, private logger: Logger) {}

  public getRecentFiles = (): string[] => {
    if (!this.cachedRecentFiles) {
      if (this.fs.existsSync(this.recentFilesFilePath)) {
        this.cachedRecentFiles = JSON.parse(
          this.fs.readFileSync(this.recentFilesFilePath, 'utf8')
        );
      } else {
        this.cachedRecentFiles = [];
      }
    }

    return [...this.cachedRecentFiles];
  };

  public setRecentFiles = (recentFiles: string[]) => {
    this.cachedRecentFiles = recentFiles;
    this.fs
      .writeFile(this.recentFilesFilePath, JSON.stringify(recentFiles))
      .catch((reason) => {
        this.logger.warn('Failed to save recent files', reason);
      });
  };
}
