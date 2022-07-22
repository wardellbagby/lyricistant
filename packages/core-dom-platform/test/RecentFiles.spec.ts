import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { DOMRecentFiles } from '@lyricistant/core-dom-platform/platform/DOMRecentFiles';

describe('Recent Files', () => {
  let recentFiles: RecentFiles;

  beforeEach(() => {
    jest.resetAllMocks();
    recentFiles = new DOMRecentFiles();
  });

  it('round-trip works', () => {
    const expected = ['hi.txt'];

    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).toEqual(actual);
  });

  it('updates work', () => {
    const initial = ['hi.txt'];
    const expected = ['tambiet.txt'];

    recentFiles.setRecentFiles(initial);
    recentFiles.setRecentFiles(expected);

    const actual = recentFiles.getRecentFiles();

    expect(expected).toEqual(actual);
  });
});
