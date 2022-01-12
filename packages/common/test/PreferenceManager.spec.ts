import { RendererDelegate } from '@lyricistant/common/Delegates';
import { PreferenceManager } from '@lyricistant/common/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common/preferences/Preferences';
import {
  PreferencesData,
  RhymeSource,
  ColorScheme,
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import {
  SystemPalette,
  SystemTheme,
  SystemThemeProvider,
} from '@lyricistant/common/theme/SystemTheme';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Preference Manager', () => {
  let manager: PreferenceManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let preferences: StubbedInstance<Preferences>;
  let systemThemeProvider: StubbedInstance<SystemThemeProvider>;

  const rendererListeners: Map<string, (...args: any[]) => void> = new Map();
  const rendererListenersSetListeners: Map<string, () => void> = new Map();
  let systemThemeChangeListener: (
    systemTheme: SystemTheme,
    systemPalette?: SystemPalette
  ) => void;

  beforeEach(() => {
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    rendererDelegate.addRendererListenerSetListener.callsFake(
      (channel, onRendererListenerSet) => {
        rendererListenersSetListeners.set(channel, onRendererListenerSet);
      }
    );
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

    expect(rendererDelegate.on).to.have.been.calledWith('save-prefs');
    expect(
      rendererDelegate.addRendererListenerSetListener
    ).to.have.been.calledWith('prefs-updated');
    expect(
      rendererDelegate.addRendererListenerSetListener
    ).to.have.been.calledWith('theme-updated');
  });

  it('sends prefs when the renderer registers for updates', async () => {
    manager.register();

    await rendererListenersSetListeners.get('prefs-updated')();

    expect(rendererDelegate.send).to.have.been.calledWith('prefs-updated', {
      textSize: 16,
      colorScheme: ColorScheme.System,
      rhymeSource: RhymeSource.Datamuse,
      font: Font.Roboto,
    });
  });

  it('sends real prefs that were loaded from the platform', async () => {
    const prefs: PreferencesData = {
      textSize: 22,
      colorScheme: ColorScheme.Dark,
      rhymeSource: RhymeSource.Offline,
      font: Font.Roboto_Mono,
    };
    preferences.getPreferences.resolves(prefs);

    manager.register();

    await rendererListenersSetListeners.get('prefs-updated')();

    expect(rendererDelegate.send).to.have.been.calledWith(
      'prefs-updated',
      prefs
    );
  });

  it('saves prefs to the platform', () => {
    const prefs: PreferencesData = {
      textSize: 22,
      colorScheme: ColorScheme.Dark,
      rhymeSource: RhymeSource.Datamuse,
      font: Font.Roboto_Mono,
    };
    const theme: ThemeData = { ...prefs, systemPalette: undefined };

    manager.register();

    rendererListeners.get('save-prefs')(prefs);

    expect(preferences.setPreferences).to.have.been.calledWith(prefs);
    expect(rendererDelegate.send).to.have.been.calledWith(
      'prefs-updated',
      prefs
    );
    expect(rendererDelegate.send).to.have.been.calledWith(
      'theme-updated',
      theme
    );
  });

  it('responds to system theme changes', async () => {
    manager.register();

    await systemThemeChangeListener(SystemTheme.Light);

    expect(rendererDelegate.send).to.have.been.calledWithMatch(
      'theme-updated',
      sinon.match({
        colorScheme: ColorScheme.Light,
      })
    );

    await systemThemeChangeListener(SystemTheme.Dark);

    expect(rendererDelegate.send).to.have.been.calledWithMatch(
      'theme-updated',
      sinon.match({
        colorScheme: ColorScheme.Dark,
      })
    );
  });

  it('responds to system theme changes with palettes', async () => {
    manager.register();

    await systemThemeChangeListener(SystemTheme.Light, { primary: '#121212' });

    expect(rendererDelegate.send).to.have.been.calledWithMatch(
      'theme-updated',
      sinon.match({
        colorScheme: ColorScheme.Light,
        systemPalette: { primary: '#121212' },
      })
    );

    await systemThemeChangeListener(SystemTheme.Dark, { surface: '#434343' });

    expect(rendererDelegate.send).to.have.been.calledWithMatch(
      'theme-updated',
      sinon.match({
        colorScheme: ColorScheme.Dark,
        systemPalette: { surface: '#434343' },
      })
    );
  });
});
