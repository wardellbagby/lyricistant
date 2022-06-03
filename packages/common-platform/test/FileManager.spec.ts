import { TextDecoder, TextEncoder } from 'util';
import { FileDataExtension } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { Files } from '@lyricistant/common-platform/files/Files';
import { FileHandler } from '@lyricistant/common-platform/files/handlers/FileHandler';
import { LyricistantFileHandler } from '@lyricistant/common-platform/files/handlers/LyricistantFileHandler';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import {
  ColorScheme,
  DefaultFileType,
  Font,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);
const decode = (buffer: ArrayBuffer): string =>
  new TextDecoder().decode(buffer);

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
describe('File Manager', () => {
  let manager: FileManager;
  let files: StubbedInstance<Files>;
  let recentFiles: StubbedInstance<RecentFiles>;
  let lyricsFileHandler: StubbedInstance<FileHandler>;
  let textFileHandler: StubbedInstance<FileHandler>;
  let preferences: StubbedInstance<Preferences>;
  const rendererDelegate = new MockRendererDelegate();
  const mockExtension: StubbedInstance<Writable<FileDataExtension>> =
    stubInterface<FileDataExtension>();

  beforeEach(() => {
    sinon.reset();
    files = stubInterface<Files>({
      openFile: Promise.resolve({
        metadata: {
          path: '/path/test',
          name: 'test',
        },
        data: encode(''),
        type: 'text/plain',
      }),
      saveFile: Promise.resolve({ path: '/path/test2' }),
    });
    recentFiles = stubInterface<RecentFiles>({
      setRecentFiles: undefined,
      getRecentFiles: ['1', '2', '3'],
    });
    lyricsFileHandler = stubInterface<FileHandler>({
      canHandle: true,
    });
    textFileHandler = stubInterface<LyricistantFileHandler>({
      canHandle: true,
    });
    preferences = stubInterface();
    preferences.getPreferences.resolves({
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
      font: Font.Roboto_Mono,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      rhymeSource: RhymeSource.Offline,
    });

    lyricsFileHandler.extension = 'lyrics';
    lyricsFileHandler.load.callsFake(async (file) => ({
      lyrics: decode(file.data),
    }));
    lyricsFileHandler.create.callsFake(async (file) => encode(file.lyrics));
    textFileHandler.extension = 'txt';
    textFileHandler.create.callsFake(async (file) => encode(file.lyrics));
    mockExtension.key = 'hello';
    mockExtension.serialize.returns({ version: 1, data: 'world' });

    manager = new FileManager(
      rendererDelegate,
      files,
      recentFiles,
      [lyricsFileHandler, textFileHandler],
      [mockExtension],
      preferences,
      stubInterface()
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
  });

  it("doesn't save duplicates to recent files", async () => {
    recentFiles.getRecentFiles.returns(['1', '2', '3', '/path/test']);
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test',
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

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
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
    recentFiles.getRecentFiles.returns(['1', '2', '3', 'test']);
    files.openFile.resolves(undefined);

    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(recentFiles.setRecentFiles).to.have.not.been.called;
  });

  it('asks the renderer if its okay for a new file when asked by platform', async () => {
    manager.register();

    manager.onNewFile();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'check-file-modified'
    );
  });

  it('asks the renderer if its okay for a new file when asked by renderer', async () => {
    manager.register();

    await rendererDelegate.invoke('new-file-attempt');

    expect(rendererDelegate.send).to.have.been.calledWith(
      'check-file-modified'
    );
  });

  it('shows a prompt when creating a new file and the renderer says current file has modifications', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Cancel' }
    );

    manager.register();

    manager.onNewFile();

    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).to.have.been.calledWithMatch('show-dialog', {
      tag: FileManager.CONFIRM_NEW_FILE_TAG,
    });
  });

  it('shows a prompt when opening a file and the renderer says current file has modifications', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_OPEN_FILE_TAG,
      { selectedButton: 'Cancel' }
    );

    manager.register();

    await rendererDelegate.invoke('ready-for-events');

    await manager.onOpenFile();

    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).to.have.been.calledWithMatch('show-dialog', {
      tag: FileManager.CONFIRM_OPEN_FILE_TAG,
    });
  });

  it('creates a new file when prompt dialog says yes was chosen', async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Create New File' }
    );

    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).to.have.been.calledWith('new-file-created');
  });

  it("does nothing when prompt dialog doesn't say yes was chosen", async () => {
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_NEW_FILE_TAG,
      { selectedButton: 'Cancel' }
    );

    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', true);

    expect(files.openFile).to.not.have.been.called;
    expect(rendererDelegate.send).to.have.not.been.calledWithMatch(
      'file-opened'
    );
  });

  it('creates a new file when the renderer says new file is okay', async () => {
    manager.register();
    await manager.onNewFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).to.have.not.been.calledWithMatch(
      'show-dialog'
    );
    expect(rendererDelegate.send).to.have.been.calledWith('new-file-created');
  });

  it('opens the file when prompt dialog says yes was chosen', async () => {
    files.openFile.callsFake((file) => Promise.resolve(file));
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CONFIRM_OPEN_FILE_TAG,
      { selectedButton: 'Open File' }
    );

    manager.register();
    await rendererDelegate.invoke('ready-for-events');
    await manager.onOpenFile({
      metadata: {
        path: 'whitetuxedo.txt',
      },
      type: 'text/plain',
      data: encode('This water'),
    });
    await rendererDelegate.invoke('is-file-modified', true);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      'whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('asks for renderer text when platform requests a file save', async () => {
    manager.register();

    manager.onSaveFile(false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'request-editor-text'
    );
  });

  it('saves the file when the renderer returns the editor text', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.onSaveFile(false);

    await rendererDelegate.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).to.have.been.calledWith(
      encode('Reeboks on; just do it!'),
      'Lyrics.lyrics'
    );
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves as the file when the renderer returns the editor text', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    manager.onSaveFile(true);

    await rendererDelegate.invoke('editor-text', 'Reeboks on; just do it!');

    expect(files.saveFile).to.have.been.calledWith(
      encode('Reeboks on; just do it!')
    );
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves a new file when the renderer says to save with no file loaded', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).to.have.been.calledWith(
      encode('Blessings, blessings.')
    );
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/path/test2',
      '1',
      '2',
      '3',
    ]);
  });

  it('saves the current file when the renderer says to save with a file loaded', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.returns(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      })
    );
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).to.have.been.calledWith(
      encode('Blessings, blessings.'),
      'Lyrics.lyrics',
      '/Desktop/whitetuxedo.txt'
    );
    expect(fileChangeListener).to.have.been.called;
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the current file when the platform returns a new file path', async () => {
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);
    files.openFile.returns(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      })
    );
    files.saveFile.returns(
      Promise.resolve({
        name: 'whitetuxedo.txt',
        path: '/Desktop/whitetuxedo2.txt',
      })
    );
    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');
    await rendererDelegate.invoke('save-file-attempt', 'Blessings, blessings.');

    expect(files.saveFile).to.have.been.calledWith(
      encode('Blessings, blessings.'),
      'Lyrics.lyrics',
      '/Desktop/whitetuxedo2.txt'
    );
    expect(fileChangeListener).to.have.been.called.callCount(3);
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo2.txt',
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
  });

  it('updates the renderer when a file is opened by the platform', async () => {
    files.openFile.returns(
      Promise.resolve({
        metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
        data: encode('This water'),
        type: '',
      })
    );
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await manager.onOpenFile();
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });

  it('updates the renderer when a file is opened by the platform directly', async () => {
    files.openFile.resolvesArg(0);
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await rendererDelegate.invoke('ready-for-events');
    await manager.onOpenFile({
      metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
      data: encode('This water'),
      type: '',
    });
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'This water',
      true
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });

  it('updates the renderer when a file is opened by the renderer', async () => {
    files.openFile.resolvesArg(0);
    const fileChangeListener: (currentFile: string, recents: string[]) => void =
      sinon.fake();
    manager.addOnFileChangedListener(fileChangeListener);

    manager.register();

    await rendererDelegate.invoke('ready-for-events');
    await rendererDelegate.invoke('open-file-attempt', {
      metadata: { name: 'whitetuxedo.txt', path: '/Desktop/whitetuxedo.txt' },
      data: encode('This water'),
      type: '',
    });
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'This water'
    );
    expect(recentFiles.setRecentFiles).to.have.been.calledWith([
      '/Desktop/whitetuxedo.txt',
      '1',
      '2',
      '3',
    ]);
    expect(fileChangeListener).to.have.been.called;
  });

  it('saves opened files with the same file handler that opened them', async () => {
    lyricsFileHandler.canHandle.callsFake((file) => file.type === 'mytype');
    textFileHandler.canHandle.returns(false);
    files.openFile.returns(
      Promise.resolve({
        metadata: { name: 'anewdress.txt', path: '121' },
        data: encode('Double headed monster with a mind of its own.'),
        type: 'mytype',
      })
    );

    manager.register();
    await rendererDelegate.invoke('open-file-attempt');
    await rendererDelegate.invoke('is-file-modified', false);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'file-opened',
      undefined,
      'Double headed monster with a mind of its own.'
    );

    await rendererDelegate.invoke('save-file-attempt', 'Cherry Red Chariot');

    expect(mockExtension.onBeforeSerialization).to.have.been.calledWith(
      'Cherry Red Chariot'
    );
    expect(lyricsFileHandler.create).to.have.been.calledWith({
      lyrics: 'Cherry Red Chariot',
      extensions: {
        hello: JSON.stringify(mockExtension.serialize()),
      },
    });
  });

  it('saves saved files with the same file handler that saved them', async () => {
    lyricsFileHandler.canHandle.callsFake((file) => file.type === 'mytype');
    textFileHandler.canHandle.returns(false);
    lyricsFileHandler.create.resolves(encode('Hello'));
    files.saveFile.resolves({ path: 'a/path.lyrics' });

    manager.register();

    await rendererDelegate.invoke('save-file-attempt', 'Hello');
    expect(files.saveFile).to.have.been.calledWith(
      encode('Hello'),
      'Lyrics.lyrics'
    );
    await rendererDelegate.invoke('save-file-attempt', 'Hello');
    expect(files.saveFile).to.have.been.calledWith(
      encode('Hello'),
      'Lyrics.lyrics'
    );

    expect(mockExtension.onBeforeSerialization).to.have.been.calledWith(
      'Hello'
    );
    expect(lyricsFileHandler.create).to.have.been.calledWith({
      lyrics: 'Hello',
      extensions: {
        hello: JSON.stringify(mockExtension.serialize()),
      },
    });
  });

  it('prompts the user for their chosen file handler - lyrics', async () => {
    preferences.getPreferences.resolves({
      defaultFileType: DefaultFileType.Always_Ask,
      font: Font.Roboto_Mono,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      rhymeSource: RhymeSource.Offline,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      { selectedButton: 'Lyricistant file (.lyrics)' }
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(mockExtension.onBeforeSerialization).to.have.been.calledWith(
      'Hiiipower'
    );
    expect(lyricsFileHandler.create).to.have.been.calledWith({
      lyrics: 'Hiiipower',
      extensions: {
        hello: JSON.stringify(mockExtension.serialize()),
      },
    });
  });
  it('prompts the user for their chosen file handler - text', async () => {
    preferences.getPreferences.resolves({
      defaultFileType: DefaultFileType.Always_Ask,
      font: Font.Roboto_Mono,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      rhymeSource: RhymeSource.Offline,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      { selectedButton: 'Confirm', selectedOption: 'Plain Text (.txt)' }
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(mockExtension.onBeforeSerialization).to.have.been.calledWith(
      'Hiiipower'
    );
    expect(textFileHandler.create).to.have.been.calledWith({
      lyrics: 'Hiiipower',
      extensions: {
        hello: JSON.stringify(mockExtension.serialize()),
      },
    });
  });
  it('saves the default file handler', async () => {
    preferences.getPreferences.resolves({
      defaultFileType: DefaultFileType.Always_Ask,
      font: Font.Roboto_Mono,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      rhymeSource: RhymeSource.Offline,
    });
    rendererDelegate.invokeOnSet(
      'dialog-interaction',
      FileManager.CHOOSE_FILE_HANDLER_TAG,
      {
        selectedButton: 'Confirm',
        selectedOption: 'Plain Text (.txt)',
        checkboxes: {
          'Never Ask Again': true,
        },
      }
    );

    manager.register();
    await rendererDelegate.invoke('save-file-attempt', 'Hiiipower');

    expect(preferences.setPreferences).to.have.been.calledWith({
      defaultFileType: DefaultFileType.Plain_Text,
      font: Font.Roboto_Mono,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      rhymeSource: RhymeSource.Offline,
    });
  });
});
