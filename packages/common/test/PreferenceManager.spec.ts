import { RendererDelegate } from '@lyricistant/common/Delegates';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import { PreferencesData, Theme } from '@lyricistant/common/preferences/PreferencesData';
import { SystemTheme, SystemThemeProvider } from '@lyricistant/common/theme/SystemTheme';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Preference Manager', () => {
  let manager: PreferenceManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let preferences: StubbedInstance<Preferences>;
  let systemThemeProvider: StubbedInstance<SystemThemeProvider>;

  const rendererListeners: Map<string, (...args: any[]) => void> = new Map();
  let systemThemeChangeListener: (systemTheme: SystemTheme) => void;

  beforeEach(() => {
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    preferences = stubInterface<Preferences>();
    systemThemeProvider = stubInterface<SystemThemeProvider>();
    systemThemeProvider.onChange.callsFake((listener) => {
      systemThemeChangeListener = listener;
    });

    manager = new PreferenceManager(
      rendererDelegate,
      systemThemeProvider,
      preferences
    );
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it('registers on the renderer delegate the events it cares about', () => {
    manager.register();

    expect(rendererDelegate.on).to.have.been.calledWith('ready-for-events');
    expect(rendererDelegate.on).to.have.been.calledWith('save-prefs');
  });

  it('sends prefs when the renderer is ready', () => {
    manager.register();

    rendererListeners.get('ready-for-events')();

    expect(rendererDelegate.send).to.have.been.calledWith('prefs-updated', {
      textSize: 16,
      theme: Theme.System,
    });
  });

  it('sends real prefs that were loaded from the platform', () => {
    const prefs: PreferencesData = {
      textSize: 22,
      theme: Theme.Dark,
    };
    preferences.getPreferences.returns(prefs);

    manager.register();

    rendererListeners.get('ready-for-events')();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'prefs-updated',
      prefs
    );
  });

  it('saves prefs to the platform', () => {
    const prefs: PreferencesData = {
      textSize: 22,
      theme: Theme.Dark,
    };

    manager.register();

    rendererListeners.get('save-prefs')(prefs);

    expect(preferences.setPreferences).to.have.been.calledWith(prefs);
    expect(rendererDelegate.send).to.have.been.calledWith(
      'prefs-updated',
      prefs
    );
    expect(rendererDelegate.send).to.have.been.calledWith('close-prefs');
    expect(rendererDelegate.send).to.have.been.calledWith(
      'dark-mode-toggled',
      prefs.textSize,
      true
    );
  });

  it("only sends close if prefs weren't saved", () => {
    const prefs: PreferencesData = undefined;

    manager.register();

    rendererListeners.get('save-prefs')(prefs);

    expect(preferences.setPreferences).to.have.not.been.called;
    expect(rendererDelegate.send).to.have.not.been.calledWith('prefs-updated');
    expect(rendererDelegate.send).to.have.not.been.calledWith(
      'dark-mode-toggled'
    );
    expect(rendererDelegate.send).to.have.been.calledWith('close-prefs');
  });

  it('responds to system theme changes', () => {
    manager.register();

    systemThemeChangeListener(SystemTheme.Light);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'dark-mode-toggled',
      16,
      false
    );

    systemThemeChangeListener(SystemTheme.Dark);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'dark-mode-toggled',
      16,
      true
    );
  });
});
