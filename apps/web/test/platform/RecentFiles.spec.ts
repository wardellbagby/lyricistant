import { expect, use } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { RecentFiles } from '@common/files/RecentFiles';
import { WebRecentFiles } from '@web-app/platform/RecentFiles';
import { removeJSDOM, setupJSDOM } from './setupJSDOM';

use(sinonChai);
use(chaiAsPromised);

describe('Recent Files', () => {
  let recentFiles: RecentFiles;

  beforeEach(() => {
    sinon.reset();
    setupJSDOM();
    recentFiles = new WebRecentFiles();
  });
  afterEach(() => removeJSDOM());

  it('round-trip works', async () => {
    const expected = ['hi.txt'];

    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).to.deep.equal(actual);
  });

  it('updates work', async () => {
    const initial = ['hi.txt'];
    const expected = ['tambiet.txt'];

    recentFiles.setRecentFiles(initial);
    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).to.deep.equal(actual);
  });
});