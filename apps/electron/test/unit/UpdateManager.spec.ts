import { AppStore } from '@electron-app/AppStore';
import { ReleaseHelper } from '@electron-app/platform/ReleaseHelper';
import { UpdateManager } from '@electron-app/platform/UpdateManager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  RendererListeners,
  EventListeners,
} from '@testing/utilities/Listeners';
import { expect, use } from 'chai';
import { AppUpdater } from 'electron-updater';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Update Manager', () => {
  let manager: UpdateManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let store: StubbedInstance<AppStore>;
  let appUpdater: StubbedInstance<AppUpdater>;
  let releaseHelper: StubbedInstance<ReleaseHelper>;
  const rendererListeners = new RendererListeners();
  const appUpdaterListeners = new EventListeners();

  beforeEach(() => {
    sinon.reset();
    store = stubInterface<AppStore>();
    store.get.returns([]);
    appUpdater = stubInterface();
    appUpdater.checkForUpdates.resolves(null);
    appUpdater.downloadUpdate.resolves(null);
    appUpdater.on.callsFake(function (event, listener) {
      appUpdaterListeners.set(event as string, listener);
      return this;
    });
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    releaseHelper = stubInterface();
    releaseHelper.getReleaseData.resolves({
      changelog: 'Hello!',
      baseDownloadUrl: 'https://example.com/',
    });

    manager = new UpdateManager(
      rendererDelegate,
      store,
      appUpdater,
      stubInterface(),
      releaseHelper,
      stubInterface()
    );
  });

  afterEach(() => {
    store.get.alwaysCalledWithExactly('ignoredVersions', []);
    rendererListeners.clear();
    appUpdaterListeners.clear();
  });

  it('registers for dialog button clicks on register', async () => {
    manager.register();

    expect(rendererDelegate.on).to.have.been.calledWith('dialog-interaction');
  });

  it('checks for update when the renderer is ready', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });

    expect(appUpdater.setFeedURL).to.have.been.calledWith(
      'https://example.com/'
    );
    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        tag: (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
        title: 'Update Available',
      })
    );
  });

  it('does not check for updates when there is no new release', async () => {
    manager.register();
    releaseHelper.getReleaseData.resolves(null);

    await rendererListeners.invoke('ready-for-events');

    expect(appUpdater.checkForUpdates).to.have.not.been.called;
    expect(appUpdater.setFeedURL).to.have.not.been.called;
    expect(rendererDelegate.send).to.have.not.been.called;
  });

  it('starts downloading an update when user clicks yes', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' }
    );

    expect(appUpdater.downloadUpdate).to.have.been.called;
  });

  it('ignores this version when user clicks never', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Never' }
    );

    expect(appUpdater.downloadUpdate).to.have.not.been.called;
    expect(store.set).to.have.been.calledWith('ignoredVersions', ['9.9.9']);
  });

  it('does nothing when user clicks no', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'No' }
    );

    expect(appUpdater.downloadUpdate).to.have.not.been.called;
    expect(store.set).to.have.not.been.called;
  });

  it('shows download progress', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' }
    );
    await appUpdaterListeners.invoke('download-progress', {
      transferred: 1,
      total: 100,
    });
    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        title: 'Downloading Update',
        progress: 1,
      })
    );

    await appUpdaterListeners.invoke('download-progress', {
      transferred: 80,
      total: 100,
    });
    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        title: 'Downloading Update',
        progress: 80,
      })
    );
  });

  it('shows update downlaoded dialog', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' }
    );
    await appUpdaterListeners.invoke('update-downloaded');

    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        tag: (UpdateManager as any).UPDATE_DOWNLOADED_DIALOG_TAG,
        title: 'Update Downloaded',
      })
    );
  });

  it('the app quits and restarts when user clicks restart', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' }
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).UPDATE_DOWNLOADED_DIALOG_TAG,
      { selectedButton: 'Restart' }
    );

    expect(appUpdater.quitAndInstall).to.have.been.called;
  });

  it('the app does nothing when user clicks Later', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      { selectedButton: 'Yes' }
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererListeners.invoke(
      'dialog-interaction',
      (UpdateManager as any).UPDATE_DOWNLOADED_DIALOG_TAG,
      { selectedButton: 'Later' }
    );

    expect(appUpdater.quitAndInstall).to.have.not.been.called;
  });
});