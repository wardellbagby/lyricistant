import { RendererDelegate } from '@common/Delegates';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { RendererListeners, EventListeners } from '@testing/utilities';
import { UpdateManager } from '@electron-app/platform/UpdateManager';
import { AppStore } from '@electron-app/AppStore';
import { AppUpdater } from 'electron-updater';

use(sinonChai);

describe('Update Manager', () => {
  let manager: UpdateManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let store: StubbedInstance<AppStore>;
  let appUpdater: StubbedInstance<AppUpdater>;
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
    rendererDelegate.send.returns(undefined);
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });

    manager = new UpdateManager(
      rendererDelegate,
      store,
      appUpdater,
      stubInterface()
    );
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it('registers for dialog button clicks on register', async () => {
    manager.register();

    expect(rendererDelegate.on).to.have.been.calledWith(
      'dialog-button-clicked'
    );
  });

  it('checks for update when the renderer is ready', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });

    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        tag: (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
        title: 'Update Available',
      })
    );
  });

  it('starts downloading an update when user clicks yes', async () => {
    manager.register();

    await rendererListeners.invoke('ready-for-events');
    await appUpdaterListeners.invoke('update-available', {
      releaseName: 'v9.9.9',
      version: '9.9.9',
    });
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Yes'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Never'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'No'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Yes'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Yes'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Yes'
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UpdateManager as any).UPDATE_DOWNLOADED_DIALOG_TAG,
      'Restart'
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
      'dialog-button-clicked',
      (UpdateManager as any).INSTALL_UPDATE_DIALOG_TAG,
      'Yes'
    );
    await appUpdaterListeners.invoke('update-downloaded');
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UpdateManager as any).UPDATE_DOWNLOADED_DIALOG_TAG,
      'Later'
    );

    expect(appUpdater.quitAndInstall).to.have.not.been.called;
  });
});
