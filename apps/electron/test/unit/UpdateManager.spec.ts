import expect from 'expect';
import { UpdateManager } from '@electron-app/platform/UpdateManager';
import { ReleaseHelper } from '@lyricistant/common/releases/ReleaseHelper';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { EventListeners } from '@testing/utilities/Listeners';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { AppUpdater } from 'electron-updater';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('Update Manager', () => {
  let manager: UpdateManager;
  let appData: DeepMockProxy<AppData>;
  let appUpdater: DeepMockProxy<AppUpdater>;
  let releaseHelper: DeepMockProxy<ReleaseHelper>;
  let rendererDelegate: MockRendererDelegate;
  const appUpdaterListeners = new EventListeners();

  beforeEach(() => {
    jest.resetAllMocks();
    rendererDelegate = new MockRendererDelegate();
    appData = mockDeep();
    appData.get.mockImplementation((key) => {
      if (key == UpdateManager.IGNORED_VERSIONS_KEY) {
        return Promise.resolve(null);
      }
    });

    appUpdater = mockDeep();
    appUpdater.checkForUpdates.mockResolvedValue(null);
    appUpdater.downloadUpdate.mockResolvedValue(null);
    appUpdater.on.mockImplementation(function (event, listener) {
      appUpdaterListeners.set(event as string, listener);
      return this;
    });
    releaseHelper = mockDeep();
    releaseHelper.getLatestDownloadableRelease.mockResolvedValue({
      changelog: 'Hello!',
      baseDownloadUrl: 'https://example.com/',
    });

    manager = new UpdateManager(
      rendererDelegate,
      appData,
      appUpdater,
      mockDeep(),
      releaseHelper,
      mockDeep(),
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
    appUpdaterListeners.clear();
  });

  it('registers for dialog button clicks on register', async () => {
    manager.register();

    expect(rendererDelegate.on).toHaveBeenCalledWith(
      'dialog-interaction',
      expect.anything(),
    );
  });

  it('checks for update when the renderer is ready', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });

    expect(appUpdater.setFeedURL).toHaveBeenCalledWith('https://example.com/');
    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        tag: UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
        title: 'Update available',
      }),
    );
  });

  it('does not check for updates when there is no new release', async () => {
    manager.register();
    releaseHelper.getLatestDownloadableRelease.mockResolvedValue(null);

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });

    expect(appUpdater.checkForUpdates).not.toHaveBeenCalled();
    expect(appUpdater.setFeedURL).not.toHaveBeenCalled();
    expect(rendererDelegate.send).not.toHaveBeenCalled();
  });

  it('starts downloading an update when user clicks yes', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' },
    );

    expect(appUpdater.downloadUpdate).toHaveBeenCalled();
  });

  it('ignores this version when user clicks never', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Never' },
    );

    expect(appUpdater.downloadUpdate).not.toHaveBeenCalled();

    // @ts-expect-error recursive typing hell
    expect(appData.set).toHaveBeenCalledWith(
      UpdateManager.IGNORED_VERSIONS_KEY,
      ['9.9.9'],
    );
  });

  it('does nothing when user clicks no', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'No' },
    );

    expect(appUpdater.downloadUpdate).not.toHaveBeenCalled();
    expect(appData.set).not.toHaveBeenCalled();
  });

  it('shows download progress', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' },
    );
    await appUpdaterListeners.invoke('download-progress', {
      transferred: 1,
      total: 100,
    });
    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        title: 'Downloading update',
        progress: 1,
      }),
    );

    await appUpdaterListeners.invoke('download-progress', {
      transferred: 80,
      total: 100,
    });
    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        title: 'Downloading update',
        progress: 80,
      }),
    );
  });

  it('shows update downlaoded dialog', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' },
    );
    await appUpdaterListeners.invoke('update-downloaded');

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        tag: UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
        title: 'Update downloaded',
      }),
    );
  });

  it('the app quits and restarts when user clicks restart', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' },
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
      { selectedButton: 'Restart' },
    );

    expect(appUpdater.quitAndInstall).toHaveBeenCalled();
  });

  it('the app does nothing when user clicks Later', async () => {
    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' },
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererDelegate.invoke(
      'dialog-interaction',
      UpdateManager.UPDATE_DOWNLOADED_DIALOG_TAG,
      { selectedButton: 'Later' },
    );

    expect(appUpdater.quitAndInstall).not.toHaveBeenCalled();
  });
});
