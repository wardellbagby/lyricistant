import expect from 'expect';
import { TextEncoder } from 'util';
import { ElectronFiles } from '@electron-app/platform/ElectronFiles';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { Files } from '@lyricistant/common-platform/files/Files';
import { BrowserWindow, Dialog } from 'electron';
import { mockDeep } from 'jest-mock-extended';
import { Buffer } from 'memfs/lib/internal/buffer';

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);

declare module 'expect' {
  // Annoying bug in the typing for objectContaining which fails for interfaces,
  // which don't have an index type and so can't be used for Record<string, *>
  // types.
  interface AsymmetricMatchers {
    objectContaining<T extends object>(sample: T): T;
  }
}

describe('Files', () => {
  const dialogs = mockDeep<Dialog>();
  const fs = mockDeep<FileSystem>();
  const window = mockDeep<BrowserWindow>();
  let files: Files;

  beforeEach(() => {
    jest.resetAllMocks();
    files = new ElectronFiles(dialogs, fs, window);
  });

  it('shows a dialog to choose a file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'mycoollyrics.txt' },
      data: Buffer.from(encode('Here are lyrics!')),
      type: '',
    };
    dialogs.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: [expected.metadata.path],
    });
    fs.readFile.mockResolvedValue(Buffer.from(expected.data));
    fs.isText.mockReturnValue(true);

    const actual = await files.openFile();

    expect(actual).toEqual(expected);
    expect(dialogs.showOpenDialog).toHaveBeenCalledWith(
      window,
      expect.objectContaining({
        properties: ['openFile'],
        filters: [
          { extensions: ['lyrics'], name: 'Lyrics' },
          { extensions: ['txt'], name: 'Text files' },
          { extensions: ['*'], name: 'All files' },
        ],
      }),
    );
    expect(fs.readFile).toHaveBeenCalledWith('mycoollyrics.txt');
  });

  it('loads a droppable file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'mycoollyrics.txt' },
      data: Buffer.from(encode('Here are lyrics!')),
    };
    fs.isText.mockReturnValue(true);

    const actual = await files.openFile(expected);

    expect(actual).toEqual(expect.objectContaining(actual));
    expect(dialogs.showOpenDialog).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('shows a file picker when saving a file with no file path', async () => {
    const expected = { path: 'mycoollyrics.txt' };
    dialogs.showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: expected.path,
    });
    fs.writeFile.mockResolvedValue();

    const actual = await files.saveFile(encode('oh wow!'), 'defaultname.txt');

    expect(expected).toEqual(actual);
    expect(dialogs.showSaveDialog).toHaveBeenCalledWith(window, {
      defaultPath: 'defaultname.txt',
    });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expected.path,
      Buffer.from(encode('oh wow!')),
    );
  });

  it('saves the file when saving a file with a file path', async () => {
    const expected = { path: 'mycoollyrics.txt' };
    fs.writeFile.mockResolvedValue();

    const actual = await files.saveFile(
      encode('oh wow!'),
      'lyrics.txt',
      'mycoollyrics.txt',
    );

    expect(expected).toEqual(actual);
    expect(dialogs.showSaveDialog).not.toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      'mycoollyrics.txt',
      Buffer.from(encode('oh wow!')),
    );
  });

  it('reads files when given a valid text file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'moarlife.txt' },
      data: encode('moar tests'),
    };
    fs.readFile.mockResolvedValue(Buffer.from(expected.data));

    const actual = await files.readFile(expected.metadata.path);

    expect(actual).toEqual(expect.objectContaining(expected));
    expect(fs.readFile).toHaveBeenCalled();
  });
});
