import { CoreFiles } from '@lyricistant/core-platform/platform/Files';
import { expect, use } from 'chai';
import sinon, { stubInterface } from 'ts-sinon';
import sinonChai from 'sinon-chai';
import {
  FileMetadata,
  Files,
  LYRICS_EXTENSION,
  LYRICS_MIME_TYPE,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import chaiAsPromised from 'chai-as-promised';
import { FileSystem } from '@lyricistant/core-platform/wrappers/FileSystem';
import { FileSystemHandle, FileWithHandle } from 'browser-fs-access';
import chaiSubset from 'chai-subset';

use(sinonChai);
use(chaiAsPromised);
use(chaiSubset);

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);

describe('Files', () => {
  const fs = stubInterface<FileSystem>();
  let files: Files;

  beforeEach(() => {
    sinon.reset();
    files = new CoreFiles(fs, stubInterface());
  });

  it('shows a dialog to choose a file', async () => {
    const expected: DeepPartial<PlatformFile> = {
      metadata: {
        name: 'mycoollyrics.txt',
      },
      data: encode('Here are lyrics!'),
    };
    fs.openFile.resolves(
      new File(['Here are lyrics!'], 'mycoollyrics.txt', { type: 'text/plain' })
    );

    const actual = await files.openFile();

    expect(actual).to.containSubset(expected);
    expect(fs.openFile).to.have.been.calledWith({
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

    expect(actual).to.deep.equal(expected);
    expect(fs.openFile).to.have.not.been.called;
  });

  it('shows a file picker when saving a file with no file handle', async () => {
    const expected: Partial<FileMetadata> = { name: 'Lyrics.lyrics' };
    fs.saveFile.resolves({
      name: 'Lyrics.lyrics',
      kind: 'file',
      isSameEntry: undefined,
      queryPermission: undefined,
      requestPermission: undefined,
    });

    const actual = await files.saveFile(encode('oh wow!'));

    expect(actual).to.deep.include(expected);
    expect(fs.saveFile).to.have.been.calledWith(
      new Blob([encode('oh wow!')], {
        type: LYRICS_MIME_TYPE,
      }),
      {
        fileName: 'Lyrics.lyrics',
        extensions: ['.lyrics'],
      }
    );
  });

  it('saves the file when saving a file with a file handle', async () => {
    const handle: FileSystemHandle = {
      name: 'mycoollyrics.txt',
      kind: 'file',
      isSameEntry: () => undefined,
      requestPermission: () => undefined,
      queryPermission: () => undefined,
    };

    const file: FileWithHandle = new File(['oh'], 'mycoollyrics.lyrics', {
      type: LYRICS_MIME_TYPE,
    });
    file.handle = handle;
    fs.openFile.resolves(file);

    const openFileResult: PlatformFile = await files.openFile();

    const expected: FileMetadata = {
      name: 'mycoollyrics.lyrics',
      path: openFileResult.metadata.path,
    };
    fs.saveFile.resolves({
      name: 'mycoollyrics.lyrics',
      kind: 'file',
      isSameEntry: undefined,
      queryPermission: undefined,
      requestPermission: undefined,
    });

    const actual = await files.saveFile(
      encode('oh wow!'),
      openFileResult.metadata.path
    );

    expect(actual).to.deep.equal(expected);
    expect(fs.saveFile).to.have.been.calledWith(
      new Blob([encode('oh wow!')], {
        type: LYRICS_MIME_TYPE,
      }),
      {
        fileName: 'Lyrics.lyrics',
        extensions: ['.lyrics'],
      },
      handle
    );
  });
});
