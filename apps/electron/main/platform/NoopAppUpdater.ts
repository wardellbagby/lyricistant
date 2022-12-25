import { UpdateCheckResult, AppUpdater } from 'electron-updater';

export class NoopAppUpdater extends AppUpdater {
  public constructor() {
    super(null);
  }

  public checkForUpdates(): Promise<UpdateCheckResult | null> {
    return Promise.resolve(null);
  }

  public quitAndInstall = (): void => undefined;

  protected doInstall(): boolean {
    return false;
  }

  protected doDownloadUpdate(): Promise<string[]> {
    return Promise.resolve(undefined);
  }
}
