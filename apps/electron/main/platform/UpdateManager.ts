import { isDevelopment, isUiTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common/Manager';
import { AppUpdater, UpdateInfo } from 'electron-updater';
import { AppStore } from '@electron-app/AppStore';
import axios from 'axios';

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
    private logger: Logger
  ) {}

  public register(): void {
    this.setupAppUpdater();
    this.rendererDelegate.on(
      'dialog-button-clicked',
      this.onDialogButtonClicked
    );
    this.rendererDelegate.on('ready-for-events', this.checkForUpdates);
  }

  private setupAppUpdater = () => {
    this.appUpdater.logger = this.logger;
    this.appUpdater.autoDownload = false;
    this.appUpdater.autoInstallOnAppQuit = true;
  };

  private checkForUpdates = () => {
    if (isDevelopment || isUiTest) {
      this.logger.verbose('Skipping update checks since this is a dev build.');
      return;
    }
    this.appUpdater.removeAllListeners();

    this.appUpdater.on('update-available', async (updateInfo: UpdateInfo) => {
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
        title: 'Update Available',
        message: `An update is available to ${updateInfo.version}. Would you like to install it now?`,
        collapsibleMessage: {
          label: 'Changelog',
          message: await this.getChangelog(updateInfo.releaseName),
        },
        buttons: ['Never', 'No', 'Yes'],
      });
    });
    this.appUpdater.on('download-progress', ({ transferred, total }) => {
      const percent = transferred / total;
      this.rendererDelegate.send('show-dialog', {
        title: 'Downloading Update',
        progress: percent * 100,
      });
    });
    this.appUpdater.on('error', (error) => {
      this.logger.warn('An error occurred with the auto updater.', error);
      this.rendererDelegate.send('show-dialog', {
        title: 'Error Downloading',
        message:
          'An error occurred while downloading the update. Please try again later.',
        buttons: ['OK'],
      });
    });
    this.appUpdater.on('update-downloaded', () => {
      this.rendererDelegate.send('show-dialog', {
        tag: UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
        title: 'Update Downloaded',
        message:
          'A new update for Lyricistant has been downloaded. It will be installed when the app restarts. Would you like to restart now?',
        buttons: ['Later', 'Restart'],
      });
    });
    this.appUpdater
      .checkForUpdates()
      .catch((reason) =>
        this.logger.warn('Failed to check for updates', reason)
      );
  };

  private onDialogButtonClicked = (dialogTag: string, buttonLabel: string) => {
    switch (dialogTag) {
      case UpdateManager.INSTALL_UPDATE_DIALOG_TAG:
        this.onUpdateAvailableDialogClicked(buttonLabel);
        break;
      case UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG:
        this.onUpdateDownloadedDialogClicked(buttonLabel);
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
    const response = await axios.get<{ body: string }>(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response?.data?.body ?? 'Unable to fetch changelog';
  };
}
