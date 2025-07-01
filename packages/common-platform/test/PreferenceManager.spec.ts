import expect from 'expect';
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
import { PreferenceManager } from '@lyricistant/common-platform/preferences/PreferenceManager';
import { Preferences } from '@lyricistant/common-platform/preferences/Preferences';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { mock, MockProxy } from 'jest-mock-extended';

describe('Preference Manager', () => {
  let manager: PreferenceManager;
  let preferences: MockProxy<Preferences>;
  let systemThemeProvider: MockProxy<SystemThemeProvider>;

  const rendererDelegate = new MockRendererDelegate();
  let systemThemeChangeListener: (
    systemTheme: SystemTheme,
    systemPalette?: SystemPalette,
  ) => void;

  beforeEach(() => {
    preferences = mock<Preferences>();
    systemThemeProvider = mock<SystemThemeProvider>();
    systemThemeProvider.onChange.mockImplementation((listener) => {
      systemThemeChangeListener = listener;
    });

    manager = new PreferenceManager(
      rendererDelegate,
      systemThemeProvider,
      preferences,
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
  });

  it('registers on the renderer delegate the events it cares about', () => {
    manager.register();

    expect(rendererDelegate.on).toHaveBeenCalledWith(
      'save-prefs',
      expect.anything(),
    );
    expect(
      rendererDelegate.addRendererListenerSetListener,
    ).toHaveBeenCalledWith('prefs-updated', expect.anything());
    expect(
      rendererDelegate.addRendererListenerSetListener,
    ).toHaveBeenCalledWith('theme-updated', expect.anything());
  });

  it('sends prefs when the renderer registers for updates', async () => {
    manager.register();

    await rendererDelegate.invokeRendererListenerSetListener('prefs-updated');

    expect(rendererDelegate.send).toHaveBeenCalledWith('prefs-updated', {
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
    preferences.getPreferences.mockResolvedValue(prefs);

    manager.register();

    await rendererDelegate.invokeRendererListenerSetListener('prefs-updated');

    expect(rendererDelegate.send).toHaveBeenCalledWith('prefs-updated', prefs);
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

    expect(preferences.setPreferences).toHaveBeenCalledWith(prefs);
    expect(rendererDelegate.send).toHaveBeenCalledWith('prefs-updated', prefs);
    expect(rendererDelegate.send).toHaveBeenCalledWith('theme-updated', theme);
  });

  it('responds to system theme changes', async () => {
    manager.register();

    await systemThemeChangeListener(SystemTheme.Light);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'theme-updated',
      expect.objectContaining({
        colorScheme: ColorScheme.Light,
      }),
    );

    await systemThemeChangeListener(SystemTheme.Dark);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'theme-updated',
      expect.objectContaining({
        colorScheme: ColorScheme.Dark,
      }),
    );
  });

  it('responds to system theme changes with palettes', async () => {
    manager.register();

    await systemThemeChangeListener(SystemTheme.Light, { primary: '#121212' });

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'theme-updated',
      expect.objectContaining({
        colorScheme: ColorScheme.Light,
        systemPalette: { primary: '#121212' },
      }),
    );

    await systemThemeChangeListener(SystemTheme.Dark, { surface: '#434343' });

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'theme-updated',
      expect.objectContaining({
        colorScheme: ColorScheme.Dark,
        systemPalette: { surface: '#434343' },
      }),
    );
  });
});
