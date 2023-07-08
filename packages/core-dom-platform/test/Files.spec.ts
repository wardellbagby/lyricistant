import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import {
  Files,
  LYRICS_EXTENSION,
  LYRICS_MIME_TYPE,
} from '@lyricistant/common-platform/files/Files';
import { DOMFiles } from '@lyricistant/core-dom-platform/platform/DOMFiles';
import { FileSystem } from '@lyricistant/core-dom-platform/wrappers/FileSystem';
import { FileWithHandle } from 'browser-fs-access';
import { mock, MockProxy } from 'jest-mock-extended';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);

describe('Files', () => {
  let fs: MockProxy<FileSystem>;
  let files: Files;

  beforeEach(() => {
    fs = mock<FileSystem>();
    files = new DOMFiles(fs, mock());
  });

  it('shows a dialog to choose a file', async () => {
    const expected: DeepPartial<PlatformFile> = {
      metadata: {
        name: 'mycoollyrics.txt',
      },
      data: encode('Here are lyrics!'),
    };
    fs.openFile.mockResolvedValue(
      new File(['Here are lyrics!'], 'mycoollyrics.txt', {
        type: 'text/plain',
      })
    );

    const actual = await files.openFile();

    expect(actual).toMatchObject(expected);
    expect(fs.openFile).toHaveBeenCalledWith({
      mimeTypes: ['text/plain', LYRICS_MIME_TYPE],
      extensions: ['.txt', LYRICS_EXTENSION],
      multiple: false,
    });
  });

  it('loads a droppable file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'mycoollyrics.txt' },
      data: encode('Here are lyrics!'),
      type: 'text/plain',
    };

    const actual = await files.openFile({
      metadata: { path: expected.metadata.path },
      data: expected.data,
      type: 'text/plain',
    });

    expect(actual).toEqual(expected);
    expect(fs.openFile).not.toHaveBeenCalled();
  });

  it('shows a file picker when saving a file with no file handle', async () => {
    const data = encode('oh wow!');
    const expected: Partial<FileMetadata> = { name: 'Lyrics.lyrics' };
    const expectedBuffer = new Uint8Array(
      await new Blob([data], {
        type: LYRICS_MIME_TYPE,
      }).arrayBuffer()
    );
    fs.saveFile.mockResolvedValue({
      name: 'Lyrics.lyrics',
      kind: 'file',
      isSameEntry: undefined,
      getFile: undefined,
    });

    const actual = await files.saveFile(data, 'MyLyrics.lyrics');
    expect(actual).toMatchObject(expected);
    expect(fs.saveFile).toHaveBeenCalled();

    const actualBlob = fs.saveFile.mock.lastCall[0];
    const actualOptions = fs.saveFile.mock.lastCall[1];

    expect(
      new Uint8Array(new Uint8Array(await (await actualBlob).arrayBuffer()))
    ).toEqual(expectedBuffer);
    expect(actualOptions).toEqual({
      fileName: 'MyLyrics.lyrics',
    });
  });

  it('saves the file when saving a file with a file handle', async () => {
    const handle: FileSystemFileHandle = {
      name: 'mycoollyrics.txt',
      kind: 'file',
      isSameEntry: () => undefined,
      getFile: () => undefined,
    };

    const file: FileWithHandle = new File(['oh'], 'mycoollyrics.lyrics', {
      type: LYRICS_MIME_TYPE,
    });
    file.handle = handle;
    fs.openFile.mockResolvedValue(file);

    const openFileResult: PlatformFile = await files.openFile();

    const expected: FileMetadata = {
      name: 'mycoollyrics.lyrics',
      path: openFileResult.metadata.path,
    };
    fs.saveFile.mockResolvedValue({
      name: 'mycoollyrics.lyrics',
      kind: 'file',
      isSameEntry: undefined,
      getFile: undefined,
    });

    const actual = await files.saveFile(
      encode('oh wow!'),
      'defaultfilename.lyrics',
      openFileResult.metadata.path
    );

    expect(actual).toEqual(expected);
    expect(fs.saveFile).toHaveBeenCalledWith(
      new Blob([encode('oh wow!')], {
        type: LYRICS_MIME_TYPE,
      }),
      {
        fileName: 'defaultfilename.lyrics',
      },
      handle
    );
  });
});
