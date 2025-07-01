import expect from 'expect';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { UnsavedDataManager } from '@lyricistant/common-platform/files/UnsavedDataManager';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { Times } from '@lyricistant/common-platform/time/Times';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { mock, MockProxy } from 'jest-mock-extended';

describe('Unsaved Data Manager', () => {
  let manager: UnsavedDataManager;
  let fileManager: MockProxy<FileManager>;
  let appData: MockProxy<AppData>;
  let fileHistory: MockProxy<FileHistory>;
  let times: MockProxy<Times>;
  let rendererDelegate: MockRendererDelegate;

  let fileChangedListener: (...args: unknown[]) => void;
  let initialFileLoadedListener: (...args: unknown[]) => void;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();

    rendererDelegate = new MockRendererDelegate();
    appData = mock<AppData>();
    appData.get.mockResolvedValue(Promise.resolve('{}'));

    fileHistory = mock<FileHistory>();
    fileHistory.getParsedHistory.mockReturnValue('Unsaved data');
    fileHistory.isNonEmptyHistory.mockResolvedValue(true);

    fileManager = mock<FileManager>();
    fileManager.addOnFileChangedListener.mockImplementation((listener) => {
      fileChangedListener = listener;
    });
    fileManager.setInitialFileLoadedListener.mockImplementation((listener) => {
      initialFileLoadedListener = listener;
    });

    manager = new UnsavedDataManager(
      rendererDelegate,
      fileManager,
      appData,
      fileHistory,
      times,
      mock(),
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
  });

  it('sets the initial file loaded listener on the FileManager', async () => {
    manager.register();

    expect(initialFileLoadedListener).not.toBeNull();
  });

  it('prompts if unsaved data is found', async () => {
    appData.exists.mockResolvedValue(true);
    fileHistory.isNonEmptyHistory.mockResolvedValue(true);

    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'No' },
    );
    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        tag: UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
        title: 'Recover unsaved lyrics',
      }),
    );
  });

  it('does not prompt if unsaved data is not found', async () => {
    appData.exists.mockResolvedValue(false);
    fileHistory.isNonEmptyHistory.mockResolvedValue(false);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).not.toHaveBeenCalled();
  });

  it('does not prompt if unsaved data is found but is not valid', async () => {
    appData.exists.mockResolvedValue(true);
    fileHistory.isNonEmptyHistory.mockResolvedValue(false);

    manager.register();
    await initialFileLoadedListener();

    expect(rendererDelegate.send).not.toHaveBeenCalled();
  });

  it('loads the unsaved data if user selects to', async () => {
    appData.exists.mockResolvedValue(true);

    manager.register();
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'Yes' },
    );
    await initialFileLoadedListener();

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'Unsaved data',
      false,
    );
  });

  it('does not load the unsaved data if user selects to', async () => {
    appData.exists.mockResolvedValue(true);

    manager.register();
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'No' },
    );
    await initialFileLoadedListener();

    expect(rendererDelegate.send).not.toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'Unsaved data',
      false,
    );
  });

  it('deletes the unsaved data on file change', async () => {
    appData.exists.mockResolvedValue(false);

    manager.register();
    await initialFileLoadedListener();
    fileChangedListener();

    expect(appData.delete).toHaveBeenCalled();
  });

  it('deletes the unsaved data on file change after user did not load unsaved data', async () => {
    appData.exists.mockResolvedValue(true);

    manager.register();
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      UnsavedDataManager.RECOVER_UNSAVED_LYRICS_TAG,
      { selectedButton: 'No' },
    );
    await initialFileLoadedListener();

    fileChangedListener();

    expect(appData.delete).toHaveBeenCalled();
  });
});
