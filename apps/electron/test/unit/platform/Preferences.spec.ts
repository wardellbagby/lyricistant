import { ElectronPreferences } from '@electron-app/platform/ElectronPreferences';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import {
  ColorScheme,
  DefaultFileType,
  Font,
  PreferencesData,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';

use(sinonChai);
use(chaiAsPromised);

describe('Preferences', () => {
  const fs = stubInterface<FileSystem>();
  let preferences: Preferences;

  beforeEach(() => {
    sinon.reset();
    fs.getDataDirectory.returns('user');
    fs.resolve.callsFake((...args: string[]) => args.join('/'));
    preferences = new ElectronPreferences(fs, stubInterface());
  });

  it('gets preferences when preferences have been set', async () => {
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
    };
    fs.existsSync.returns(true);
    fs.readFileSync.returns(JSON.stringify(expected));

    const actual = await preferences.getPreferences();

    expect(actual).to.deep.equal(expected);
    expect(fs.readFileSync).to.have.been.calledWith('user/preferences.json');
  });

  it('caches preferences when preferences have been set', async () => {
    fs.readFileSync.returns(JSON.stringify({ textSize: 2 }));
    fs.existsSync.returns(true);

    await preferences.getPreferences();
    await preferences.getPreferences();
    await preferences.getPreferences();
    await preferences.getPreferences();

    expect(fs.readFileSync).to.have.been.calledOnceWith(
      'user/preferences.json'
    );
  });

  it('returns nothing when preferences have not been set', async () => {
    fs.existsSync.returns(false);

    expect(await preferences.getPreferences()).to.be.undefined;

    expect(fs.readFileSync).to.have.not.been.called;
  });

  it('sets the preferences', async () => {
    fs.writeFile.resolves();

    await preferences.setPreferences({
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
    });

    expect(fs.writeFile).to.have.been.calledWith('user/preferences.json');
  });

  it('caches the preferences after setting them', async () => {
    fs.writeFile.resolves();

    await preferences.setPreferences({
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      colorScheme: ColorScheme.Dark,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
    });
    await preferences.getPreferences();

    expect(fs.readFileSync).to.have.not.been.called;
  });
});
