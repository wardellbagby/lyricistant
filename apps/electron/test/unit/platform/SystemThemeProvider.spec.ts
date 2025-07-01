import expect from 'expect';
import { ElectronSystemThemeProvider } from '@electron-app/platform/ElectronSystemThemeProvider';
import { SystemTheme } from '@lyricistant/common/theme/SystemTheme';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { EventListeners } from '@testing/utilities/Listeners';
import { NativeTheme } from 'electron';
import { mockDeep } from 'jest-mock-extended';

describe('System Theme', () => {
  const nativeTheme =
    mockDeep<{ -readonly [P in keyof NativeTheme]: NativeTheme[P] }>();
  const nativeThemeListeners = new EventListeners();
  let systemThemeProvider: SystemThemeProvider;

  beforeEach(() => {
    jest.resetAllMocks();
    nativeThemeListeners.clear();
    nativeTheme.on.mockImplementation(function (event, listener) {
      nativeThemeListeners.set(event, listener as () => void);
      return this;
    });
    systemThemeProvider = new ElectronSystemThemeProvider(nativeTheme);
  });

  it('updates listener when native theme updates', async () => {
    const listener = jest.fn();

    nativeTheme.shouldUseDarkColors = false;
    systemThemeProvider.onChange(listener);
    expect(listener).toHaveBeenCalledWith(SystemTheme.Light);

    nativeTheme.shouldUseDarkColors = true;
    await nativeThemeListeners.invoke('updated');
    expect(listener).toHaveBeenCalledWith(SystemTheme.Dark);
  });
});
