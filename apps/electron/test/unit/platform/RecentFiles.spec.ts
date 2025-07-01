import expect from 'expect';
import { ElectronRecentFiles } from '@electron-app/platform/ElectronRecentFiles';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { RecentFiles } from '@lyricistant/common-platform/files/RecentFiles';
import { mockDeep } from 'jest-mock-extended';

describe('Recent Files', () => {
  const fs = mockDeep<FileSystem>();
  let recentFiles: RecentFiles;

  beforeEach(() => {
    jest.resetAllMocks();
    fs.getDataDirectory.mockReturnValue('user');
    fs.resolve.mockImplementation((...args: string[]) => args.join('/'));
    recentFiles = new ElectronRecentFiles(fs, mockDeep());
  });

  it('gets recents when recents have been set', () => {
    const expected = ['blueoceanfloor.txt', 'mirror.txt'];
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(expected));

    const actual = recentFiles.getRecentFiles();

    expect(expected).toEqual(actual);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      'user/recent_files.json',
      'utf8',
    );
  });

  it('caches recents when recents have been set', () => {
    fs.readFileSync.mockReturnValue(
      JSON.stringify(['blueoceanfloor.txt', 'mirror.txt']),
    );
    fs.existsSync.mockReturnValue(true);

    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();
    recentFiles.getRecentFiles();

    expect(fs.readFileSync).toHaveBeenCalledWith(
      'user/recent_files.json',
      'utf8',
    );
  });

  it('returns default when recents have not been set', () => {
    fs.existsSync.mockReturnValue(false);

    expect(recentFiles.getRecentFiles()).toEqual([]);

    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('sets the recents', () => {
    fs.writeFile.mockResolvedValue();

    const newRecentFiles = ['cabaret.txt'];

    recentFiles.setRecentFiles(newRecentFiles);

    expect(fs.writeFile).toHaveBeenCalledWith(
      'user/recent_files.json',
      JSON.stringify(newRecentFiles),
    );
  });

  it('caches the recents after setting them', () => {
    fs.writeFile.mockResolvedValue();

    recentFiles.setRecentFiles(['suit & tie.txt']);
    recentFiles.getRecentFiles();

    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
