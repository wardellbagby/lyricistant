import { expect, use } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { CorePreferences } from '@lyricistant/core-platform/platform/Preferences';
import {
  PreferencesData,
  RhymeSource,
  ColorScheme,
} from '@lyricistant/common/preferences/PreferencesData';
import { Preferences } from '@lyricistant/common/preferences/Preferences';

use(sinonChai);
use(chaiAsPromised);

describe('Preferences', () => {
  let preferences: Preferences;

  beforeEach(() => {
    sinon.reset();
    preferences = new CorePreferences();
  });

  it('round-trip works', () => {
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      theme: ColorScheme.Dark,
    };

    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).to.deep.equal(actual);
  });

  it('updates work', () => {
    const initial: PreferencesData = {
      textSize: 24,
      rhymeSource: RhymeSource.Datamuse,
      theme: ColorScheme.Dark,
    };
    const expected: PreferencesData = {
      textSize: 2,
      rhymeSource: RhymeSource.Datamuse,
      theme: ColorScheme.Dark,
    };

    preferences.setPreferences(initial);
    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).to.deep.equal(actual);
  });
});
