/* tslint:disable:no-unused-expression only-arrow-functions object-literal-shorthand */
import { expect, use } from 'chai';
import { RendererDelegate } from 'common/Delegates';
import { Dialogs } from 'common/dialogs/Dialogs';
import type { FileManager } from 'common/files/FileManager';
import { FileData, Files } from 'common/files/Files';
import { RecentFiles } from 'common/files/RecentFiles';
import proxyquire from 'proxyquire';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('File Manager', () => {
  let manager: FileManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let files: StubbedInstance<Files>;
  let recentFiles: StubbedInstance<RecentFiles>;
  let dialogs: StubbedInstance<Dialogs>;
  const rendererListeners: Map<string, (...args: any[]) => void> = new Map();

  beforeEach(() => {
    sinon.reset();
    files = stubInterface<Files>({
      openFile: Promise.resolve(new FileData('test', '')),
      saveFile: Promise.resolve(),
    });
    recentFiles = stubInterface<RecentFiles>({
      setRecentFiles: undefined,
      getRecentFiles: ['1', '2', '3'],
    });
    dialogs = stubInterface<Dialogs>({
      showDialog: Promise.resolve('cancelled'),
    });
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    const ManagerConstructor = proxyquire
      .noCallThru()
      .load('common/files/FileManager', {
        'platform/Files': {
          Files: function () {
            return files;
          },
        },
        'platform/RecentFiles': {
          RecentFiles: function () {
            return recentFiles;
          },
        },
        'platform/Dialogs': {
          Dialogs: function () {
            return dialogs;
          },
        },
      }).FileManager;

    manager = new ManagerConstructor(rendererDelegate);
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it("doesn't save duplicates to recent files", async () => {
    recentFiles.getRecentFiles.returns(['1', '2', '3', 'test']);
    manager.register();

    await manager.openFile();

    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      'test',
      '1',
      '2',
      '3',
    ]);
  });

  it('caps the max recents to 10', async () => {
    recentFiles.getRecentFiles.returns([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    manager.register();

    await manager.openFile();

    expect(recentFiles.setRecentFiles).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      'test',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
  });
});
