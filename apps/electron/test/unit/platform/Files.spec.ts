import { TextEncoder } from 'util';
import { ElectronFiles } from '@electron-app/platform/ElectronFiles';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { Files } from '@lyricistant/common-platform/files/Files';
import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';
import { BrowserWindow, Dialog } from 'electron';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';

use(sinonChai);
use(chaiAsPromised);
use(chaiSubset);

const encode = (text: string): ArrayBuffer => new TextEncoder().encode(text);

describe('Files', () => {
  const dialogs = stubInterface<Dialog>();
  const fs = stubInterface<FileSystem>();
  const window = stubInterface<BrowserWindow>();
  let files: Files;

  beforeEach(() => {
    sinon.reset();
    files = new ElectronFiles(dialogs, fs, window);
  });

  it('shows a dialog to choose a file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'mycoollyrics.txt' },
      data: encode('Here are lyrics!'),
      type: '',
    };
    dialogs.showOpenDialog.resolves({
      canceled: false,
      filePaths: [expected.metadata.path],
    });
    fs.readFile.resolves(Buffer.from(expected.data));
    fs.isText.returns(true);

    const actual = await files.openFile();

    expect(actual).to.deep.equal(expected);
    expect(dialogs.showOpenDialog).to.have.been.calledWith(
      window,
      sinon.match({
        properties: ['openFile'],
        filters: [
          { extensions: ['lyrics'], name: 'Lyrics' },
          { extensions: ['txt'], name: 'Text files' },
          { extensions: ['*'], name: 'All Files' },
        ],
      })
    );
    expect(fs.readFile).to.have.been.calledWith('mycoollyrics.txt');
  });

  it('loads a droppable file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'mycoollyrics.txt' },
      data: encode('Here are lyrics!'),
    };
    fs.isText.returns(true);

    const actual = await files.openFile(expected);

    expect(actual).to.containSubset(expected);
    expect(dialogs.showOpenDialog).to.have.not.been.called;
    expect(fs.readFile).to.have.not.been.called;
  });

  it('shows a file picker when saving a file with no file path', async () => {
    const expected = { path: 'mycoollyrics.txt' };
    dialogs.showSaveDialog.resolves({
      canceled: false,
      filePath: expected.path,
    });
    fs.writeFile.resolves();

    const actual = await files.saveFile(encode('oh wow!'), 'defaultname.txt');

    expect(expected).to.deep.equal(actual);
    expect(dialogs.showSaveDialog).to.have.been.calledWith(window, {
      defaultPath: 'defaultname.txt',
    });
    expect(fs.writeFile).to.have.been.calledWith(
      expected.path,
      Buffer.from(encode('oh wow!'))
    );
  });

  it('saves the file when saving a file with a file path', async () => {
    const expected = { path: 'mycoollyrics.txt' };
    fs.writeFile.resolves();

    const actual = await files.saveFile(
      encode('oh wow!'),
      'lyrics.txt',
      'mycoollyrics.txt'
    );

    expect(expected).to.deep.equal(actual);
    expect(dialogs.showSaveDialog).to.have.not.been.called;
    expect(fs.writeFile).to.have.been.calledWith(
      'mycoollyrics.txt',
      Buffer.from(encode('oh wow!'))
    );
  });

  it('reads files when given a valid text file', async () => {
    const expected: PlatformFile = {
      metadata: { path: 'moarlife.txt' },
      data: encode('moar tests'),
    };
    fs.readFile.resolves(Buffer.from(expected.data));

    const actual = await files.readFile(expected.metadata.path);

    expect(actual).to.containSubset(expected);
    expect(fs.readFile).to.have.been.called;
  });
});
