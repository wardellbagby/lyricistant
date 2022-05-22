import { ElectronSystemThemeProvider } from '@electron-app/platform/ElectronSystemThemeProvider';
import { SystemThemeProvider } from '@lyricistant/common-platform/theme/SystemThemeProvider';
import { SystemTheme } from '@lyricistant/common/theme/SystemTheme';
import { EventListeners } from '@testing/utilities/Listeners';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NativeTheme } from 'electron';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';

use(sinonChai);
use(chaiAsPromised);

describe('System Theme', () => {
  const nativeTheme =
    stubInterface<{ -readonly [P in keyof NativeTheme]: NativeTheme[P] }>();
  const nativeThemeListeners = new EventListeners();
  let systemThemeProvider: SystemThemeProvider;

  beforeEach(() => {
    sinon.reset();
    nativeThemeListeners.clear();
    nativeTheme.on.callsFake(function (event, listener) {
      nativeThemeListeners.set(event, listener as () => void);
      return this;
    });
    systemThemeProvider = new ElectronSystemThemeProvider(nativeTheme);
  });

  it('updates listener when native theme updates', async () => {
    const listener = sinon.fake();

    nativeTheme.shouldUseDarkColors = false;
    systemThemeProvider.onChange(listener);
    expect(listener).calledWith(SystemTheme.Light);

    nativeTheme.shouldUseDarkColors = true;
    await nativeThemeListeners.invoke('updated');
    expect(listener).calledWith(SystemTheme.Dark);
  });
});
