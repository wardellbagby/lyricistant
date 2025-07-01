import expect from 'expect';
import { ElectronPreferences } from '@electron-app/platform/ElectronPreferences';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { mockDeep } from 'jest-mock-extended';

describe('Preferences', () => {
  const fs = mockDeep<FileSystem>();
  let preferences: Preferences;

  beforeEach(() => {
    jest.resetAllMocks();
    fs.getDataDirectory.mockReturnValue('user');
    fs.resolve.mockImplementation((...args: string[]) => args.join('/'));
    preferences = new ElectronPreferences(fs, mockDeep());
  });

  it('gets preferences when preferences have been set', async () => {
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(expected));

    const actual = await preferences.getPreferences();

    expect(actual).toEqual(expected);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      'user/preferences.json',
      'utf8',
    );
  });

  it('caches preferences when preferences have been set', async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ textSize: 2 }));
    fs.existsSync.mockReturnValue(true);

    await preferences.getPreferences();
    await preferences.getPreferences();
    await preferences.getPreferences();
    await preferences.getPreferences();

    expect(fs.readFileSync).toHaveBeenCalledWith(
      'user/preferences.json',
      'utf8',
    );
  });

  it('returns nothing when preferences have not been set', async () => {
    fs.existsSync.mockReturnValue(false);

    expect(await preferences.getPreferences()).toBeUndefined();

    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('sets the preferences', async () => {
    fs.writeFile.mockResolvedValue();

    const preferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };

    await preferences.setPreferences(preferencesData);

    expect(fs.writeFile).toHaveBeenCalledWith(
      'user/preferences.json',
      JSON.stringify(preferencesData),
    );
  });

  it('caches the preferences after setting them', async () => {
    fs.writeFile.mockResolvedValue();

    await preferences.setPreferences({
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    });
    await preferences.getPreferences();

    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
