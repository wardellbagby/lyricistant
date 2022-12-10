import { PreferenceManager } from '@lyricistant/common-platform/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  PreferencesData,
  RhymeSource,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import {
  SystemPalette,
  SystemTheme,
} from '@lyricistant/common/theme/SystemTheme';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Preference Manager', () => {
  let manager: PreferenceManager;
  let preferences: StubbedInstance<Preferences>;
  let systemThemeProvider: StubbedInstance<SystemThemeProvider>;

  const rendererDelegate = new MockRendererDelegate();
  let systemThemeChangeListener: (
    systemTheme: SystemTheme,
    systemPalette?: SystemPalette
  ) => void;

  beforeEach(() => {
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
    rendererDelegate.clear();
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

    await rendererDelegate.invokeRendererListenerSetListener('prefs-updated');

    expect(rendererDelegate.send).to.have.been.calledWith('prefs-updated', {
      textSize: 16,
      colorScheme: ColorScheme.System,
      rhymeSource: RhymeSource.Datamuse,
      font: Font.Roboto,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Always_Show,
    });
  });

  it('sends real prefs that were loaded from the platform', async () => {
    const prefs: PreferencesData = {
      textSize: 22,
      colorScheme: ColorScheme.Dark,
      rhymeSource: RhymeSource.Offline,
      font: Font.Roboto_Mono,
      defaultFileType: DefaultFileType.Plain_Text,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };
    preferences.getPreferences.resolves(prefs);

    manager.register();

    await rendererDelegate.invokeRendererListenerSetListener('prefs-updated');

    expect(rendererDelegate.send).to.have.been.calledWith(
      'prefs-updated',
      prefs
    );
  });

  it('saves prefs to the platform', async () => {
    const prefs: PreferencesData = {
      textSize: 22,
      colorScheme: ColorScheme.Dark,
      rhymeSource: RhymeSource.Datamuse,
      font: Font.Roboto_Mono,
      defaultFileType: DefaultFileType.Lyricistant_Lyrics,
      detailPaneVisibility: DetailPaneVisibility.Toggleable,
    };
    const theme: ThemeData = {
      ...prefs,
      colorScheme: ColorScheme.Dark,
      systemPalette: undefined,
    };

    manager.register();

    await rendererDelegate.invoke('save-prefs', prefs);

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
