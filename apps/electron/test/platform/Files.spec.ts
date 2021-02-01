import { TextEncoder } from 'util';
import { ElectronFiles } from '@electron-app/platform/Files';
import { expect, use } from 'chai';
import sinon, { stubInterface } from 'ts-sinon';
import sinonChai from 'sinon-chai';
import { BrowserWindow, Dialog } from 'electron';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { FileData } from '@common/files/Files';
import chaiAsPromised from 'chai-as-promised';
import { Files } from '@common/files/Files';

use(sinonChai);
use(chaiAsPromised);

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
    const expected: FileData = {
      filePath: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };
    dialogs.showOpenDialog.resolves({
      canceled: false,
      filePaths: [expected.filePath],
    });
    fs.readFile.resolves(expected.data);
    fs.isText.returns(true);

    const actual = await files.openFile();

    expect(expected).to.deep.equal(actual);
    expect(dialogs.showOpenDialog).to.have.been.calledWith(
      window,
      sinon.match({
        properties: ['openFile'],
        filters: [
          { extensions: ['txt'], name: 'Lyrics' },
          { extensions: ['*'], name: 'All Files' },
        ],
      })
    );
    expect(fs.readFile).to.have.been.calledWith('mycoollyrics.txt');
  });

  it('loads a droppable file', async () => {
    const expected: FileData = {
      filePath: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };
    fs.isText.returns(true);

    const actual = await files.openFile({
      path: expected.filePath,
      data: new TextEncoder().encode(expected.data).buffer,
      type: 'text/plain',
    });

    expect(expected).to.deep.equal(actual);
    expect(dialogs.showOpenDialog).to.have.not.been.called;
    expect(fs.readFile).to.have.not.been.called;
  });

  it('throws an error if an invalid file is chosen', async () => {
    const expected: FileData = {
      filePath: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };
    dialogs.showOpenDialog.resolves({
      canceled: false,
      filePaths: [expected.filePath],
    });
    fs.readFile.resolves(expected.data);
    fs.isText.returns(false);

    await expect(files.openFile()).to.eventually.be.rejected;

    expect(dialogs.showOpenDialog).to.have.been.calledWith(
      window,
      sinon.match({
        properties: ['openFile'],
        filters: [
          { extensions: ['txt'], name: 'Lyrics' },
          { extensions: ['*'], name: 'All Files' },
        ],
      })
    );
    expect(fs.readFile).to.have.been.calledWith(expected.filePath);
  });

  it('throws an error if an invalid file is dropped', async () => {
    const expected: FileData = {
      filePath: 'mycoollyrics.txt',
      data: 'Here are lyrics!',
    };
    fs.isText.returns(false);

    await expect(
      files.openFile({
        path: expected.filePath,
        data: new TextEncoder().encode(expected.data).buffer,
        type: 'text/plain',
      })
    ).to.eventually.be.rejected;

    expect(dialogs.showOpenDialog).to.have.not.been.called;
    expect(fs.readFile).to.have.not.been.called;
  });

  it('shows a file picker when saving a file with no file path', async () => {
    const expected = 'mycoollyrics.txt';
    dialogs.showSaveDialog.resolves({
      canceled: false,
      filePath: expected,
    });
    fs.writeFile.resolves();

    const actual = await files.saveFile({ data: 'oh wow!' });

    expect(expected).to.deep.equal(actual);
    expect(dialogs.showSaveDialog).to.have.been.calledWith(window, {
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
    });
    expect(fs.writeFile).to.have.been.calledWith(expected, 'oh wow!');
  });

  it('saves the file when saving a file with a file path', async () => {
    fs.writeFile.resolves();

    const actual = await files.saveFile({
      filePath: 'mycoollyrics.txt',
      data: 'oh wow!',
    });

    expect(actual).to.be.undefined;
    expect(dialogs.showSaveDialog).to.have.not.been.called;
    expect(fs.writeFile).to.have.been.calledWith('mycoollyrics.txt', 'oh wow!');
  });

  it('reads files when given a valid text file', async () => {
    const expected = {
      filePath: 'moarlife.txt',
      data: 'moar tests',
    };
    fs.readFile.resolves(expected.data);
    fs.isText.returns(true);

    const actual = await files.readFile(expected.filePath);

    expect(expected).to.deep.equal(actual);
    expect(fs.readFile).to.have.been.called;
    expect(fs.isText).to.have.been.called;
  });

  it('throws files when trying to read an invalid text file', async () => {
    const expected = {
      filePath: 'moarlife.txt',
      data: 'moar tests',
    };
    fs.readFile.resolves(expected.data);
    fs.isText.returns(false);

    await expect(files.readFile(expected.filePath)).to.eventually.be.rejected;

    expect(fs.readFile).to.have.been.called;
    expect(fs.isText).to.have.been.called;
  });
});
