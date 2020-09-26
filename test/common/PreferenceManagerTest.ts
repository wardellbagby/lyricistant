import { expect, use } from 'chai';
import { RendererDelegate } from 'common/Delegates';
import { PreferenceManager } from 'common/preferences/PreferenceManager';
import { PreferencesData, Theme } from 'common/preferences/PreferencesData';
import { SystemTheme } from 'common/theme/SystemTheme';
import * as PreferencesModule from 'platform/Preferences';
import * as SystemThemeModule from 'platform/SystemThemeProvider';
import sinonChai from 'sinon-chai';
import { ImportMock, MockManager } from 'ts-mock-imports';
import { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Preference Manager', () => {
  let manager: PreferenceManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let preferencesMockManager: MockManager<PreferencesModule.Preferences>;
  let systemThemeMockManager: MockManager<SystemThemeModule.SystemThemeProvider>;
  const rendererListeners: Map<string, (...args: any[]) => void> = new Map();
  let systemThemeChangeListener: (systemTheme: SystemTheme) => void;

  beforeEach(() => {
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });

    preferencesMockManager = ImportMock.mockClass(
      PreferencesModule,
      'Preferences'
    );
    preferencesMockManager.mock('getPreferences', undefined);
    preferencesMockManager.mock('setPreferences', undefined);

    systemThemeMockManager = ImportMock.mockClass(
      SystemThemeModule,
      'SystemThemeProvider'
    );
    systemThemeMockManager.set('onChange', (listener) => {
      systemThemeChangeListener = listener;
    });
    manager = new PreferenceManager(rendererDelegate);
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
    preferencesMockManager.mock('getPreferences', prefs);

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

    expect(
      preferencesMockManager.getMockInstance().setPreferences
    ).to.have.been.calledWith(prefs);
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

    // tslint:disable-next-line:no-unused-expression
    expect(preferencesMockManager.getMockInstance().setPreferences).to.have.not
      .been.called;
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
