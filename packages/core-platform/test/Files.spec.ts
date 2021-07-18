import { CoreFiles } from '@lyricistant/core-platform/platform/Files';
import { expect, use } from 'chai';
import sinon, { stubInterface } from 'ts-sinon';
import sinonChai from 'sinon-chai';
import { FileData, FileMetadata } from '@lyricistant/common/files/Files';
import chaiAsPromised from 'chai-as-promised';
import { Files } from '@lyricistant/common/files/Files';
import { FileSystem } from '@lyricistant/core-platform/wrappers/FileSystem';
import { FileSystemHandle, FileWithHandle } from 'browser-fs-access';

use(sinonChai);
use(chaiAsPromised);

describe('Files', () => {
  const fs = stubInterface<FileSystem>();
  let files: Files;

  beforeEach(() => {
    sinon.reset();
    files = new CoreFiles(fs, stubInterface());
  });

  it('shows a dialog to choose a file', async () => {
    const expected: Partial<FileData> = {
      name: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };
    fs.openFile.resolves(
      new File(['Here are lyrics!'], 'mycoollyrics.txt', { type: 'text/plain' })
    );

    const actual = await files.openFile();

    expect(actual).to.deep.include(expected);
    expect(fs.openFile).to.have.been.calledWith({
      mimeTypes: ['text/plain'],
      extensions: ['.txt'],
      multiple: false,
    });
  });

  it('loads a droppable file', async () => {
    const expected: FileData = {
      path: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };

    const actual = await files.openFile({
      path: expected.path,
      data: new TextEncoder().encode(expected.data).buffer,
      type: 'text/plain',
    });

    expect(actual).to.deep.equal(expected);
    expect(fs.openFile).to.have.not.been.called;
  });

  it('throws an error if an invalid file is chosen', async () => {
    fs.openFile.resolves(
      new File(['Here are lyrics!'], 'mycoollyrics.bin', {
        type: 'application/binary',
      })
    );

    await expect(files.openFile()).to.eventually.be.rejected;

    expect(fs.openFile).to.have.been.calledWith({
      mimeTypes: ['text/plain'],
      extensions: ['.txt'],
      multiple: false,
    });
  });

  it('throws an error if an invalid file is dropped', async () => {
    const expected: FileData = {
      path: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };

    await expect(
      files.openFile({
        path: expected.path,
        data: new TextEncoder().encode(expected.data).buffer,
        type: 'application/binary',
      })
    ).to.eventually.be.rejected;

    expect(fs.openFile).to.have.not.been.called;
  });

  it('shows a file picker when saving a file with no file handle', async () => {
    const expected: Partial<FileMetadata> = { name: 'Lyrics.txt' };
    fs.saveFile.resolves({
      name: 'Lyrics.txt',
      kind: 'file',
      isSameEntry: undefined,
      queryPermission: undefined,
      requestPermission: undefined,
    });

    const actual = await files.saveFile('oh wow!');

    expect(actual).to.deep.include(expected);
    expect(fs.saveFile).to.have.been.calledWith(
      new Blob(['oh wow!'], {
        type: 'text/plain',
      }),
      {
        fileName: 'Lyrics.txt',
        extensions: ['.txt'],
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

    const file: FileWithHandle = new File(['oh'], 'mycoollyrics.txt', {
      type: 'text/plain',
    });
    file.handle = handle;
    fs.openFile.resolves(file);

    const openFileResult = (await files.openFile()) as FileData;

    const expected: FileMetadata = {
      name: 'mycoollyrics.txt',
      path: openFileResult.path,
    };
    fs.saveFile.resolves({
      name: 'mycoollyrics.txt',
      kind: 'file',
      isSameEntry: undefined,
      queryPermission: undefined,
      requestPermission: undefined,
    });

    const actual = await files.saveFile('oh wow!', openFileResult.path);

    expect(actual).to.deep.equal(expected);
    expect(fs.saveFile).to.have.been.calledWith(
      new Blob(['oh wow!'], {
        type: 'text/plain',
      }),
      {
        fileName: 'Lyrics.txt',
        extensions: ['.txt'],
      },
      handle
    );
  });
});
