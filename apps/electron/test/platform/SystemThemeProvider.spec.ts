import { expect, use } from 'chai';
import sinon, { stubInterface } from 'ts-sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { NativeTheme } from 'electron';
import { ElectronSystemThemeProvider } from '@electron-app/platform/SystemThemeProvider';
import { SystemThemeProvider, SystemTheme } from '@common/theme/SystemTheme';
import { EventListeners } from '@testing/utilities';

use(sinonChai);
use(chaiAsPromised);

describe('System Theme', () => {
  const nativeTheme = stubInterface<NativeTheme>();
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

    // @ts-ignore
    nativeTheme.shouldUseDarkColors = false;
    systemThemeProvider.onChange(listener);
    expect(listener).calledWith(SystemTheme.Light);

    // @ts-ignore
    nativeTheme.shouldUseDarkColors = true;
    await nativeThemeListeners.invoke('updated');
    expect(listener).calledWith(SystemTheme.Dark);
  });
});
