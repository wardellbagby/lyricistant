import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileManager } from '@lyricistant/common/files/FileManager';
import { TemporaryFiles } from '@lyricistant/common/files/TemporaryFiles';
import { UnsavedDataManager } from '@lyricistant/common/files/UnsavedDataManager';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { RendererListeners } from '@testing/utilities/Listeners';

use(sinonChai);

describe('Unsaved Data Manager', () => {
  let manager: UnsavedDataManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let fileManager: StubbedInstance<FileManager>;
  let temporaryFiles: StubbedInstance<TemporaryFiles>;
  const rendererListeners = new RendererListeners();
  let fileChangedListener: (...args: any[]) => void;
  let initialFileLoadedListener: (...args: any[]) => void;

  beforeEach(() => {
    sinon.reset();
    temporaryFiles = stubInterface<TemporaryFiles>({
      get: Promise.resolve('Unsaved data'),
    });
    fileManager = stubInterface<FileManager>();
    fileManager.addOnFileChangedListener.callsFake((listener) => {
      fileChangedListener = listener;
    });
    fileManager.setInitialFileLoadedListener.callsFake((listener) => {
      initialFileLoadedListener = listener;
    });
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });

    manager = new UnsavedDataManager(
      rendererDelegate,
      fileManager,
      temporaryFiles,
      stubInterface()
    );
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it('sets the initial file loaded listener on the FileManager', async () => {
    manager.register();

    expect(initialFileLoadedListener).to.not.be.null;
  });

  it('prompts if unsaved data is found', async () => {
    temporaryFiles.exists.returns(true);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'show-dialog',
      sinon.match({
        tag: (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
        title: 'Recover unsaved lyrics',
      })
    );
  });

  it('does not prompt if unsaved data is not found', async () => {
    temporaryFiles.exists.returns(false);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).to.have.not.been.called;
  });

  it('loads the unsaved data if user selects to', async () => {
    temporaryFiles.exists.returns(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      'Yes'
    );

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      undefined,
      'Unsaved data',
      false
    );
  });

  it('does not load the unsaved data if user selects to', async () => {
    temporaryFiles.exists.returns(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      'No'
    );

    expect(rendererDelegate.send).to.have.not.been.calledWith(
      'file-opened',
      undefined,
      undefined,
      'Unsaved data',
      false
    );
  });

  it('deletes the unsaved data on file change', async () => {
    temporaryFiles.exists.returns(false);

    manager.register();
    await initialFileLoadedListener();
    fileChangedListener();

    expect(temporaryFiles.delete).to.have.been.called;
  });

  it('deletes the unsaved data on file change after user did not load unsaved data', async () => {
    temporaryFiles.exists.returns(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-button-clicked',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      'No'
    );

    fileChangedListener();

    expect(temporaryFiles.delete).to.have.been.called;
  });
});
