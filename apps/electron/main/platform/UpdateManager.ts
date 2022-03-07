import { AppStore } from '@electron-app/AppStore';
import { HttpClient } from '@electron-app/wrappers/HttpClient';
import { Manager } from '@lyricistant/common-platform/Manager';
import { isDevelopment, isUnderTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { DialogInteractionData } from '@lyricistant/common/dialogs/Dialog';
import { Logger } from '@lyricistant/common/Logger';
import { AppUpdater, UpdateInfo } from 'electron-updater';

export class UpdateManager implements Manager {
  private static readonly INSTALL_UPDATE_DIALOG_TAG =
    'update-manager-update-dialog';
  private static readonly UPDATE_DOWNLOADED_DIALOG_TAG =
    'update-manager-update-downloaded-dialog';

  private updateInfo: UpdateInfo;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private store: AppStore,
    private appUpdater: AppUpdater,
    private httpClient: HttpClient,
    private logger: Logger
  ) {}

  public register(): void {
    this.setupAppUpdater();
    this.rendererDelegate.on('dialog-interaction', this.onDialogInteraction);
    this.rendererDelegate.on('ready-for-events', this.checkForUpdates);
  }

  private setupAppUpdater = () => {
    this.appUpdater.logger = this.logger;
    this.appUpdater.autoDownload = false;
    this.appUpdater.autoInstallOnAppQuit = true;
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
    const ignoredVersions = this.store.get('ignoredVersions', []);
    if (ignoredVersions.includes(updateInfo.version)) {
      this.logger.info(
        `Ignoring update to ${updateInfo.version} since user requested not to update to it.`
      );
      return;
    }
    this.updateInfo = updateInfo;
    this.rendererDelegate.send('show-dialog', {
      tag: UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      type: 'alert',
      title: 'Update Available',
      message: `An update is available to ${updateInfo.version}. Would you like to install it now?`,
      collapsibleMessage: {
        label: 'Changelog',
        message: await this.getChangelog(updateInfo.releaseName),
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
        title: 'Error Downloading',
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
      title: 'Downloading Update',
      progress: percent * 100,
    });
  };

  private onUpdateDownloaded = () => {
    this.rendererDelegate.send('show-dialog', {
      tag: UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
      type: 'alert',
      title: 'Update Downloaded',
      message:
        'A new update for Lyricistant has been downloaded. It will be installed when the app restarts. Would you like to restart now?',
      buttons: ['Later', 'Restart'],
    });
  };

  private onDialogInteraction = (
    dialogTag: string,
    interactionData: DialogInteractionData
  ) => {
    switch (dialogTag) {
      case UpdateManager.INSTALL_UPDATE_DIALOG_TAG:
        this.onUpdateAvailableDialogClicked(interactionData.selectedButton);
        break;
      case UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG:
        this.onUpdateDownloadedDialogClicked(interactionData.selectedButton);
        break;
    }
  };

  private onUpdateAvailableDialogClicked = (buttonLabel: string) => {
    switch (buttonLabel) {
      case 'Yes':
        this.appUpdater
          .downloadUpdate()
          .catch((reason) =>
            this.logger.warn('Failed to download updates.', reason)
          );
        break;
      case 'Never':
        const ignoredVersions: string[] = this.store.get('ignoredVersion', []);
        ignoredVersions.push(this.updateInfo.version);
        this.store.set('ignoredVersions', ignoredVersions);
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

  private getChangelog = async (tag: string) => {
    const url = `https://api.github.com/repos/wardellbagby/lyricistant/releases/tags/${tag}`;
    const response = await this.httpClient.get<{ body: string }>(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      validateStatus: null,
    });
    return response?.data?.body ?? 'Unable to fetch changelog';
  };
}
