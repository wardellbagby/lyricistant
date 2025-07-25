import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { Logger } from '@lyricistant/common/Logger';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';

export class ElectronRecentFiles implements RecentFiles {
  private readonly recentFilesFilePath = this.fs.resolve(
    this.fs.getDataDirectory('userData'),
    'recent_files.json',
  );

  private cachedRecentFiles: string[];

  public constructor(
    private fs: FileSystem,
    private logger: Logger,
  ) {}

  public getRecentFiles = (): string[] => {
    if (
      !this.cachedRecentFiles &&
      this.fs.existsSync(this.recentFilesFilePath)
    ) {
      this.cachedRecentFiles = JSON.parse(
        this.fs.readFileSync(this.recentFilesFilePath, 'utf8'),
      );
    }
    return [...(this.cachedRecentFiles ?? [])];
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
