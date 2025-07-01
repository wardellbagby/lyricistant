import os from 'os';
import path from 'path';
import addCommonUiTests, {
  useMockDefinitions,
  useMockRhymes,
} from '@lyricistant/common-ui-tests';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import waitForExpect from 'wait-for-expect';
import * as fs from 'node:fs';

const viewports = [
  { label: 'default' },
  { width: 500, height: 500, label: '500 x 500' },
  { width: 1200, height: 1200, label: '1200 x 1200' },
] as const;

describe.each(viewports)('Electron launch - $label', (viewport) => {
  let app: ElectronApplication;
  let window: Page;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.resolve(os.tmpdir(), 'lyricistant-electron-test');
    fs.rmSync(tempDir, { recursive: true, force: true });
    app = await electron.launch({
      args: [
        path.resolve('apps/electron/dist/test/main.js'),
        '--no-sandbox',
        '--disable-gpu',
        '--enable-logging',
      ],
    });

    await useMockRhymes(app.context());
    await useMockDefinitions(app.context());

    await app.evaluate((electronModule, dir) => {
      electronModule.app.setPath('appData', dir);
    }, tempDir);

    window = await app.firstWindow();
    await window.waitForLoadState('networkidle');
    await window.waitForFunction(
      () => document.getElementById('preload-overlay') == null,
    );
    const elements = await window.$$('#app > *');
    expect(elements).not.toBeEmpty();

    await app.evaluate(
      (_, [newViewport, browserWindow]) => {
        if (newViewport.label === 'default') {
          return;
        } else {
          browserWindow.setSize(newViewport.width, newViewport.height);
          // Wait a little to let the resize settle. CI is notoriously slow so wait longer there.
          return new Promise((resolve) =>
            setTimeout(resolve, process.env.CI ? 2000 : 500),
          );
        }
      },
      [viewport, await app.browserWindow(window)] as const,
    );
  });

  afterEach(async () => {
    await app.close();
    app = null;
    window = null;
  });

  it('shows a single window', () => {
    expect(app.windows()).toHaveLength(1);
  });

  it('has a title of untitled', async () => {
    await waitForExpect(() => expect(window.title()).resolves.toBe('Untitled'));
  });

  addCommonUiTests(async () => ({
    page: window,
  }));
});
