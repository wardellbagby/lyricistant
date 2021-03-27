
import { expect, use } from 'chai';
import sinon, { stubInterface } from 'ts-sinon';
import sinonChai from 'sinon-chai';
import { FileSystem } from '@electron-app/wrappers/FileSystem';
import chaiAsPromised from 'chai-as-promised';
import { ElectronPreferences } from '@electron-app/platform/Preferences';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';
import { Preferences } from '@lyricistant/common/preferences/Preferences';

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
    };
    fs.existsSync.returns(true);
    fs.readFileSync.returns(JSON.stringify(expected));

    const actual = preferences.getPreferences();

    expect(expected).to.deep.equal(actual);
    expect(fs.readFileSync).to.have.been.calledWith('user/preferences.json');
  });

  it('caches preferences when preferences have been set', async () => {
    fs.readFileSync.returns(JSON.stringify({ textSize: 2 }));
    fs.existsSync.returns(true);

    preferences.getPreferences();
    preferences.getPreferences();
    preferences.getPreferences();
    preferences.getPreferences();

    expect(fs.readFileSync).to.have.been.calledOnceWith(
      'user/preferences.json'
    );
  });

  it('returns nothing when preferences have not been set', async () => {
    fs.existsSync.returns(false);

    expect(preferences.getPreferences()).to.be.undefined;

    expect(fs.readFileSync).to.have.not.been.called;
  });

  it('sets the preferences', async () => {
    fs.writeFile.resolves();

    preferences.setPreferences({ textSize: 2 });

    expect(fs.writeFile).to.have.been.calledWith('user/preferences.json');
  });

  it('caches the preferences after setting them', async () => {
    fs.writeFile.resolves();

    preferences.setPreferences({ textSize: 2 });
    preferences.getPreferences();

    expect(fs.readFileSync).to.have.not.been.called;
  });
});
