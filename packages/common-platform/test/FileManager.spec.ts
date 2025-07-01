import expect from 'expect';
import { TextDecoder, TextEncoder } from 'util';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import { FileDataExtension } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { Files } from '@lyricistant/common-platform/files/Files';
import { FileHandler } from '@lyricistant/common-platform/files/handlers/FileHandler';
import { LyricistantFileHandler } from '@lyricistant/common-platform/files/handlers/LyricistantFileHandler';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { mock, MockProxy } from 'jest-mock-extended';

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);
const decode = (buffer: ArrayBuffer): string =>
  new TextDecoder().decode(buffer);

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
describe('File Manager', () => {
  let manager: FileManager;
  let files: MockProxy<Files>;
  let recentFiles: MockProxy<RecentFiles>;
  let lyricsFileHandler: MockProxy<FileHandler>;
  let textFileHandler: MockProxy<FileHandler>;
  let preferences: MockProxy<Preferences>;
  let buffers: MockProxy<Buffers>;
  let mockExtension: MockProxy<Writable<FileDataExtension>>;
  let rendererDelegate: MockRendererDelegate;
  const defaultPreferences: PreferencesData = {
    defaultFileType: DefaultFileType.Lyricistant_Lyrics,
    font: Font.Roboto_Mono,
    colorScheme: ColorScheme.Dark,
    textSize: 16,
    rhymeSource: RhymeSource.Offline,
    detailPaneVisibility: DetailPaneVisibility.Always_Show,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    rendererDelegate = new MockRendererDelegate();

    files = mock();
    files.openFile.mockImplementation(() =>
      Promise.resolve({
        metadata: {
          path: '/path/test',
          name: 'test',
        },
        data: encode(''),
        type: 'text/plain',
      }),
    );
    files.saveFile.mockImplementation(() =>
      Promise.resolve({ path: '/path/test2' }),
    );
    files.supportsChoosingFileName.mockImplementation(() =>
      Promise.resolve(true),
    );

    recentFiles = mock();
    recentFiles.getRecentFiles.mockReturnValue(['1', '2', '3']);

    lyricsFileHandler = mock<FileHandler>();
    lyricsFileHandler.canHandle.mockReturnValue(true);

    textFileHandler = mock<LyricistantFileHandler>();
    textFileHandler.canHandle.mockReturnValue(true);

    preferences = mock();
    preferences.getPreferences.mockResolvedValue({
      ...defaultPreferences,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
    });

    buffers = mock();
    buffers.stringToBuffer.mockImplementation(encode);
    buffers.bufferToString.mockImplementation(decode);

    lyricsFileHandler.extension = 'lyrics';
    lyricsFileHandler.load.mockImplementation(async (file) => ({
      lyrics: decode(file.data),
    }));
    lyricsFileHandler.create.mockImplementation(async (file) =>
      encode(file.lyrics),
    );

    textFileHandler.extension = 'txt';
    textFileHandler.create.mockImplementation(async (file) =>
      encode(file.lyrics),
    );

    mockExtension = mock<FileDataExtension>();
    mockExtension.key = 'hello';
    mockExtension.serialize.mockResolvedValue({ version: 1, data: 'world' });

    manager = new FileManager(
      rendererDelegate,
      files,
      buffers,
      recentFiles,
      [lyricsFileHandler, textFileHandler],
      [mockExtension],
      preferences,
      mock(),
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
  });

  it("doesn't save duplicates to recent files", async () => {
    recentFiles.getRecentFiles.mockReturnValue(['1', '2', '3', '/path/test']);
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/path/test',
      '1',
      '2',
      '3',
    ]);
  });

  it('caps the max recents to 10', async () => {
    recentFiles.getRecentFiles.mockReturnValue([
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

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).toHaveBeenCalled();
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/path/test',
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

  it("doesn't add to recent files when a file is not opened", async () => {
    recentFiles.getRecentFiles.mockReturnValue(['1', '2', '3', 'test']);
    files.openFile.mockResolvedValue(undefined);

    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).not.toHaveBeenCalled();
  });

  it('asks the renderer if its okay for a new file when asked by platform', async () => {
    manager.register();

    manager.onNewFile();

    expect(rendererDelegate.send).toHaveBeenCalledWith('check-file-modified');
  });

  it('asks the renderer if its okay for a new file when asked by renderer', async () => {
    manager.register();

    await rendererDelegate.invoke('new-file-attempt');

    expect(rendererDelegate.send).toHaveBeenCalledWith('check-file-modified');
  });

  it('shows a prompt when creating a new file and the renderer says current file has modifications', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Cancel' },
    );

    manager.register();

    manager.onNewFile();

    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        tag: FileManager.CONFIRM_NEW_FILE_TAG,
      }),
    );
  });

  it('shows a prompt when opening a file and the renderer says current file has modifications', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_OPEN_FILE_TAG,
      { selectedButton: 'Cancel' },
    );

    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });

    await manager.onOpenFile();

    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'show-dialog',
      expect.objectContaining({
        tag: FileManager.CONFIRM_OPEN_FILE_TAG,
      }),
    );
  });

  it('creates a new file when prompt dialog says yes was chosen', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Create new file' },
    );

    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).toHaveBeenCalledWith('new-file-created');
    expect(mockExtension.reset).toHaveBeenCalled();
  });

  it("does nothing when prompt dialog doesn't say yes was chosen", async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Cancel' },
    );

    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', true);

    expect(files.openFile).not.toHaveBeenCalled();
    expect(rendererDelegate.send).not.toHaveBeenCalledWith('file-opened');
  });

  it('creates a new file when the renderer says new file is okay', async () => {
    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).not.toHaveBeenCalledWith('show-dialog');
    expect(rendererDelegate.send).toHaveBeenCalledWith('new-file-created');
  });

  it('opens the file when prompt dialog says yes was chosen', async () => {
    files.openFile.mockImplementation((file) => Promise.resolve(file));
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_OPEN_FILE_TAG,
      { selectedButton: 'Open file' },
    );

    manager.register();
    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await manager.onOpenFile({
      metadata: {
        path: 'whitetuxedo.txt',
      },
      type: 'text/plain',
      data: encode('This water'),
    });
    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'This water',
      true,
    );
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      'whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('asks for renderer text when platform requests a file save', async () => {
    manager.register();

    manager.onSaveFile(false);

    expect(rendererDelegate.send).toHaveBeenCalledWith('request-editor-text');
  });

  it('saves the file when the renderer mockReturnValue the editor text', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.onSaveFile(false);

    await rendererDelegate.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Reeboks on; just do it!'),
      'Lyrics.lyrics',
      undefined,
    );
    expect(fileChangeListener).toHaveBeenCalled();
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves as the file when the renderer mockReturnValue the editor text', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.onSaveFile(true);

    await rendererDelegate.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Reeboks on; just do it!'),
      'Lyrics.lyrics',
      null,
    );
    expect(fileChangeListener).toHaveBeenCalled();
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves a new file when the renderer says to save with no file loaded', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Blessings, blessings.'),
      'Lyrics.lyrics',
      undefined,
    );
    expect(fileChangeListener).toHaveBeenCalled();
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves the current file when the renderer says to save with a file loaded', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.mockReturnValue(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      }),
    );
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Blessings, blessings.'),
      'Lyrics.lyrics',
      '/Desktop/whitetuxedo.txt',
    );
    expect(fileChangeListener).toHaveBeenCalled();
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the current file when the platform mockReturnValue a new file path', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.mockReturnValue(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      }),
    );
    files.saveFile.mockReturnValue(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo2.txt',
      }),
    );
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Blessings, blessings.'),
      'Lyrics.lyrics',
      '/Desktop/whitetuxedo2.txt',
    );
    expect(fileChangeListener).toHaveBeenCalledTimes(3);
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/Desktop/whitetuxedo2.txt',
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the renderer when a file is opened by the platform', async () => {
    files.openFile.mockReturnValue(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      }),
    );
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'This water',
      true,
    );
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).toHaveBeenCalled();
  });

  it('updates the renderer when a file is opened by the platform directly', async () => {
    files.openFile.mockImplementation((file) => Promise.resolve(file));
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await manager.onOpenFile({
      metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
      data: encode('This water'),
      type: '',
    });
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'This water',
      true,
    );
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).toHaveBeenCalled();
  });

  it('updates the renderer when a file is opened by the renderer', async () => {
    files.openFile.mockImplementation((file) => Promise.resolve(file));
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      jest.fn();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await rendererDelegate.invoke('ready-for-events', { isDeepLink: false });
    await rendererDelegate.invoke('open-file-attempt', {
      metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
      data: encode('This water'),
      type: '',
    });
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'This water',
      true,
    );
    expect(recentFiles.setRecentFiles).toHaveBeenCalledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).toHaveBeenCalled();
  });

  it('saves opened files with the same file handler that opened them', async () => {
    lyricsFileHandler.canHandle.mockImplementation(
      (file) => file.type === 'mytype',
    );
    textFileHandler.canHandle.mockReturnValue(false);
    files.openFile.mockReturnValue(
      Promise.resolve({
        metadata: { name: 'anewdress.txt', path: '121' },
        data: encode('Double headed monster with a mind of its own.'),
        type: 'mytype',
      }),
    );

    manager.register();
    await rendererDelegate.invoke('open-file-attempt');
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'file-opened',
      undefined,
      'Double headed monster with a mind of its own.',
      true,
    );

    await rendererDelegate.invoke('save-file-attempt', 'Cherry Red Chariot');

    expect(mockExtension.onBeforeSerialization).toHaveBeenCalledWith(
      'Cherry Red Chariot',
    );
    expect(lyricsFileHandler.create).toHaveBeenCalledWith({
      lyrics: 'Cherry Red Chariot',
      extensions: {
        hello: encode(JSON.stringify(await mockExtension.serialize())),
      },
    });
  });

  it('saves saved files with the same file handler that saved them', async () => {
    lyricsFileHandler.canHandle.mockImplementation(
      (file) => file.type === 'mytype',
    );
    textFileHandler.canHandle.mockReturnValue(false);
    lyricsFileHandler.create.mockResolvedValue(encode('Hello'));
    files.saveFile.mockResolvedValue({ path: 'a/path.lyrics' });

    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Hello');
    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Hello'),
      'Lyrics.lyrics',
      undefined,
    );
    await rendererDelegate.invoke('save-file-attempt', 'Hello');
    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Hello'),
      'Lyrics.lyrics',
      'a/path.lyrics',
    );

    expect(mockExtension.onBeforeSerialization).toHaveBeenCalledWith('Hello');
    expect(lyricsFileHandler.create).toHaveBeenCalledWith({
      lyrics: 'Hello',
      extensions: {
        hello: encode(JSON.stringify(await mockExtension.serialize())),
      },
    });
  });

  it('prompts the user for their chosen file handler - lyrics', async () => {
    preferences.getPreferences.mockResolvedValue({
      ...defaultPreferences,
      defaultFileType: DefaultFileType.Always_Ask,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      { selectedButton: 'Lyricistant file (.lyrics)' },
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(mockExtension.onBeforeSerialization).toHaveBeenCalledWith(
      'Hiiipower',
    );
    expect(lyricsFileHandler.create).toHaveBeenCalledWith({
      lyrics: 'Hiiipower',
      extensions: {
        hello: encode(JSON.stringify(await mockExtension.serialize())),
      },
    });
  });
  it('prompts the user for their chosen file handler - text', async () => {
    preferences.getPreferences.mockResolvedValue({
      ...defaultPreferences,
      defaultFileType: DefaultFileType.Always_Ask,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      { selectedButton: 'Confirm', selectedOption: 'Plain text (.txt)' },
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(mockExtension.onBeforeSerialization).toHaveBeenCalledWith(
      'Hiiipower',
    );
    expect(textFileHandler.create).toHaveBeenCalledWith({
      lyrics: 'Hiiipower',
      extensions: {
        hello: encode(JSON.stringify(await mockExtension.serialize())),
      },
    });
  });

  it('saves the default file handler', async () => {
    preferences.getPreferences.mockResolvedValue({
      ...defaultPreferences,
      defaultFileType: DefaultFileType.Always_Ask,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      {
        selectedButton: 'Confirm',
        selectedOption: 'Plain text (.txt)',
        checkboxes: {
          'Never ask again': true,
        },
      },
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(preferences.setPreferences).toHaveBeenCalledWith({
      ...defaultPreferences,
      defaultFileType: DefaultFileType.Plain_Text,
    });
  });

  it('prompts the user for the file name', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.PROMPT_FILE_NAME_TAG,
      {
        selectedButton: 'Save',
        textField: 'gnx.lyrics',
      },
    );
    files.supportsChoosingFileName.mockResolvedValue(false);

    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Peekaboo');

    expect(files.saveFile).toHaveBeenCalledWith(
      encode('Peekaboo'),
      'gnx.lyrics',
      undefined,
    );
  });

  it('prompts the user for the file name - cancelling does nothing', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.PROMPT_FILE_NAME_TAG,
      {
        selectedButton: 'Cancel',
      },
    );
    files.supportsChoosingFileName.mockResolvedValue(false);

    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Peekaboo');

    expect(files.saveFile).not.toHaveBeenCalled();
  });
});
