import { HttpClient } from '@electron-app/wrappers/HttpClient';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { Manager } from '@lyricistant/common-platform/Manager';
import { isDevelopment, isUnderTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { DialogInteractionData } from '@lyricistant/common/dialogs/Dialog';
import { Logger } from '@lyricistant/common/Logger';
import { ReleaseHelper } from '@lyricistant/common/releases/ReleaseHelper';
import { Serializable } from '@lyricistant/common/Serializable';
import { AppUpdater, UpdateInfo } from 'electron-updater';

export class UpdateManager implements Manager {
  public static readonly IGNORED_VERSIONS_KEY = 'ignored-electron-versions';
  private static readonly INSTALL_UPDATE_DIALOG_TAG =
    'update-manager-update-dialog';
  private static readonly UPDATE_DOWNLOADED_DIALOG_TAG =
    'update-manager-update-downloaded-dialog';

  private updateInfo: UpdateInfo;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private appData: AppData,
    private appUpdater: AppUpdater,
    private httpClient: HttpClient,
    private releaseHelper: ReleaseHelper,
    private logger: Logger
  ) {}

  public register(): void {
    this.rendererDelegate.on('dialog-interaction', this.onDialogInteraction);
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
  }

  private onRendererReady = async () => {
    const releaseData = await this.releaseHelper.getLatestDownloadableRelease(
      process.env.APP_VERSION
    );

    if (releaseData?.baseDownloadUrl) {
      this.appUpdater.logger = this.logger;
      this.appUpdater.autoDownload = false;
      this.appUpdater.autoInstallOnAppQuit = true;
      this.appUpdater.setFeedURL(releaseData.baseDownloadUrl);

      this.checkForUpdates();
    }
  };

  private checkForUpdates = () => {
    if (isDevelopment || isUnderTest) {
      this.logger.verbose('Skipping update checks since this is a dev build.');
      return;
    }
    this.appUpdater.removeAllListeners();

    this.appUpdater.on('update-available', this.onUpdateAvailable);
    this.appUpdater.on('download-progress', this.onDownloadProgress);
    this.appUpdater.on('error', this.onUpdaterError);
    this.appUpdater.on('update-downloaded', this.onUpdateDownloaded);

    this.appUpdater
      .checkForUpdates()
      .catch((reason) =>
        this.logger.warn('Failed to check for updates', reason)
      );
  };

  private onUpdateAvailable = async (updateInfo: UpdateInfo) => {
    if (!updateInfo) {
      this.logger.warn("Couldn't update the app as update info was null");
      return;
    }
    const ignoredVersions = await this.getIgnoredVersionsOrDefault();
    if (ignoredVersions.includes(updateInfo.version)) {
      this.logger.info(
        `Ignoring update to ${updateInfo.version} since user requested not to update to it.`
      );
      return;
    }
    this.updateInfo = updateInfo;
    const releaseData = await this.releaseHelper.getLatestDownloadableRelease(
      process.env.APP_VERSION
    );
    this.rendererDelegate.send('show-dialog', {
      tag: UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      type: 'alert',
      title: 'Update available',
      message: `An update is available to ${updateInfo.version}. Would you like to install it now?`,
      collapsibleMessage: {
        label: 'Changelog',
        message: releaseData.changelog,
      },
      buttons: ['Never', 'No', 'Yes'],
    });
  };

  private onUpdaterError = (error: any) => {
    this.logger.warn('An error occurred with the auto updater.', error);
    // If updateInfo doesn't exist, we never prompted the user that an update was available so don't show anything.
    if (this.updateInfo) {
      this.rendererDelegate.send('show-dialog', {
        tag: 'auto-update-error',
        type: 'alert',
        title: 'Error downloading',
        message:
          'An error occurred while downloading the update. Please try again later.',
        buttons: ['OK'],
      });
    }
  };

  private onDownloadProgress = ({
    transferred,
    total,
  }: {
    transferred: number;
    total: number;
  }) => {
    const percent = transferred / total;
    this.rendererDelegate.send('show-dialog', {
      tag: 'auto-update-download-progress',
      type: 'alert',
      title: 'Downloading update',
      progress: percent * 100,
    });
  };

  private onUpdateDownloaded = () => {
    this.rendererDelegate.send('show-dialog', {
      tag: UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
      type: 'alert',
      title: 'Update downloaded',
      message:
        'A new update for Lyricistant has been downloaded. It will be installed when the app restarts. Would you like to restart now?',
      buttons: ['Later', 'Restart'],
    });
  };

  private onDialogInteraction = async (
    dialogTag: string,
    interactionData: DialogInteractionData
  ) => {
    switch (dialogTag) {
      case UpdateManager.INSTALL_UPDATE_DIALOG_TAG:
        await this.onUpdateAvailableDialogClicked(
          interactionData.selectedButton
        );
        break;
      case UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG:
        this.onUpdateDownloadedDialogClicked(interactionData.selectedButton);
        break;
    }
  };

  private onUpdateAvailableDialogClicked = async (buttonLabel: string) => {
    switch (buttonLabel) {
      case 'Yes':
        this.appUpdater
          .downloadUpdate()
          .catch((reason) =>
            this.logger.warn('Failed to download updates.', reason)
          );
        break;
      case 'Never':
        const ignoredVersions = await this.getIgnoredVersionsOrDefault();
        ignoredVersions.push(this.updateInfo.version);
        this.appData.set(UpdateManager.IGNORED_VERSIONS_KEY, ignoredVersions);
        break;
    }
  };

  private onUpdateDownloadedDialogClicked = (buttonLabel: string) => {
    switch (buttonLabel) {
      case 'Restart':
        this.appUpdater.quitAndInstall();
        break;
    }
  };

  private getIgnoredVersionsOrDefault = async (): Promise<string[]> => {
    if (!(await this.appData.exists(UpdateManager.IGNORED_VERSIONS_KEY))) {
      return [];
    }

    const result: Serializable = await this.appData.get(
      UpdateManager.IGNORED_VERSIONS_KEY
    );

    if (
      !result ||
      !Array.isArray(result) ||
      !result.every((value) => typeof value === 'string')
    ) {
      return [];
    }

    return result as string[];
  };
}
