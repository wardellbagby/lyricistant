import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { DOMRecentFiles } from '@lyricistant/core-dom-platform/platform/DOMRecentFiles';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon from 'ts-sinon';

use(sinonChai);
use(chaiAsPromised);

describe('Recent Files', () => {
  let recentFiles: RecentFiles;

  beforeEach(() => {
    sinon.reset();
    recentFiles = new DOMRecentFiles();
  });

  it('round-trip works', () => {
    const expected = ['hi.txt'];

    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).to.deep.equal(actual);
  });

  it('updates work', () => {
    const initial = ['hi.txt'];
    const expected = ['tambiet.txt'];

    recentFiles.setRecentFiles(initial);
    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).to.deep.equal(actual);
  });
});
