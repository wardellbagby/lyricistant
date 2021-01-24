import { RendererDelegate } from '@common/Delegates';
import { Dialogs } from '@common/dialogs/Dialogs';
import { FileManager } from '@common/files/FileManager';
import { TemporaryFiles } from '@common/files/TemporaryFiles';
import { UnsavedDataManager } from '@common/files/UnsavedDataManager';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { RendererListeners } from '@testing/utilities';

use(sinonChai);

describe('Unsaved Data Manager', () => {
  let manager: UnsavedDataManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let fileManager: StubbedInstance<FileManager>;
  let temporaryFiles: StubbedInstance<TemporaryFiles>;
  let dialogs: StubbedInstance<Dialogs>;
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
    dialogs = stubInterface<Dialogs>();
    rendererDelegate = stubInterface();
    rendererDelegate.send.returns(undefined);
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });

    manager = new UnsavedDataManager(
      rendererDelegate,
      fileManager,
      temporaryFiles,
      dialogs,
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

    expect(dialogs.showDialog).to.have.been.called;
  });

  it('loads the unsaved data if user selects to', async () => {
    temporaryFiles.exists.returns(true);
    dialogs.showDialog.returns(Promise.resolve('yes'));

    manager.register();
    await initialFileLoadedListener();

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
    dialogs.showDialog.returns(Promise.resolve('no'));

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).to.have.not.been.calledWith(
      'file-opened',
      undefined,
      undefined,
      'Unsaved data',
      false
    );
  });

  it('deletes the unsaved data on file change', async () => {
    temporaryFiles.exists.returns(true);
    dialogs.showDialog.returns(Promise.resolve('no'));

    manager.register();
    await initialFileLoadedListener();
    fileChangedListener();

    expect(temporaryFiles.delete).to.have.been.called;
  });
});
