import { ElectronRecentFiles } from '@electron-app/platform/ElectronRecentFiles';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';

use(sinonChai);
use(chaiAsPromised);

describe('Recent Files', () => {
  const fs = stubInterface<FileSystem>();
  let recentFiles: RecentFiles;

  beforeEach(() => {
    sinon.reset();
    fs.getDataDirectory.returns('user');
    fs.resolve.callsFake((...args: string[]) => args.join('/'));
    recentFiles = new ElectronRecentFiles(fs, stubInterface());
  });

  it('gets recents when recents have been set', () => {
    const expected = ['blueoceanfloor.txt', 'mirror.txt'];
    fs.existsSync.returns(true);
    fs.readFileSync.returns(JSON.stringify(expected));

    const actual = recentFiles.getRecentFiles();

    expect(expected).to.deep.equal(actual);
    expect(fs.readFileSync).to.have.been.calledWith('user/recent_files.json');
  });

  it('caches recents when recents have been set', () => {
    fs.readFileSync.returns(
      JSON.stringify(['blueoceanfloor.txt', 'mirror.txt']),
    );
    fs.existsSync.returns(true);

    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();

    expect(fs.readFileSync).to.have.been.calledOnceWith(
      'user/recent_files.json',
    );
  });

  it('returns default when recents have not been set', () => {
    fs.existsSync.returns(false);

    expect(recentFiles.getRecentFiles()).to.deep.equal([]);

    expect(fs.readFileSync).to.have.not.been.called;
  });

  it('sets the recents', () => {
    fs.writeFile.resolves();

    recentFiles.setRecentFiles(['cabaret.txt']);

    expect(fs.writeFile).to.have.been.calledWith('user/recent_files.json');
  });

  it('caches the recents after setting them', () => {
    fs.writeFile.resolves();

    recentFiles.setRecentFiles(['suit & tie.txt']);
    recentFiles.getRecentFiles();

    expect(fs.readFileSync).to.have.not.been.called;
  });
});
