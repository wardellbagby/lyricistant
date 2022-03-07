import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { TemporaryFiles } from '@lyricistant/common-platform/files/TemporaryFiles';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { RendererListeners } from '@testing/utilities/Listeners';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Unsaved Data Manager', () => {
  let manager: UnsavedDataManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let fileManager: StubbedInstance<FileManager>;
  let temporaryFiles: StubbedInstance<TemporaryFiles>;
  let fileHistory: StubbedInstance<FileHistory>;
  const rendererListeners = new RendererListeners();
  let fileChangedListener: (...args: any[]) => void;
  let initialFileLoadedListener: (...args: any[]) => void;

  beforeEach(() => {
    sinon.reset();
    temporaryFiles = stubInterface<TemporaryFiles>({
      get: Promise.resolve('{}'),
    });
    fileHistory = stubInterface<FileHistory>({
      getParsedHistory: 'Unsaved data',
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
      fileHistory,
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
    temporaryFiles.exists.resolves(true);
    fileHistory.isNonEmptyHistory.returns(true);

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
    temporaryFiles.exists.resolves(false);
    fileHistory.isNonEmptyHistory.returns(false);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).to.have.not.been.called;
  });

  it('does not prompt if unsaved data is found but is not valid', async () => {
    temporaryFiles.exists.resolves(true);
    fileHistory.isNonEmptyHistory.returns(false);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).to.have.not.been.called;
  });

  it('loads the unsaved data if user selects to', async () => {
    temporaryFiles.exists.resolves(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-interaction',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'Yes' }
    );

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'Unsaved data',
      false
    );
  });

  it('does not load the unsaved data if user selects to', async () => {
    temporaryFiles.exists.resolves(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-interaction',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'No' }
    );

    expect(rendererDelegate.send).to.have.not.been.calledWith(
      'file-opened',
      undefined,
      'Unsaved data',
      false
    );
  });

  it('deletes the unsaved data on file change', async () => {
    temporaryFiles.exists.resolves(false);

    manager.register();
    await initialFileLoadedListener();
    fileChangedListener();

    expect(temporaryFiles.delete).to.have.been.called;
  });

  it('deletes the unsaved data on file change after user did not load unsaved data', async () => {
    temporaryFiles.exists.resolves(true);

    manager.register();
    await initialFileLoadedListener();
    await rendererListeners.invoke(
      'dialog-interaction',
      (UnsavedDataManager as any).RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'No' }
    );

    fileChangedListener();

    expect(temporaryFiles.delete).to.have.been.called;
  });
});
