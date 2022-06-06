import os from 'os';
import path from 'path';
import addCommonUiTests from '@lyricistant/common-ui-tests';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import del from 'del';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { getDocument, getQueriesForElement } from 'playwright-testing-library';
import waitForExpect from 'wait-for-expect';

use(chaiAsPromised);

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
    await del(tempDir, {
      force: true,
    });
    app = await electron.launch({
      args: [
        path.resolve('apps/electron/dist/test/main.js'),
        '--no-sandbox',
        '--disable-gpu',
        '--enable-logging',
      ],
    });

    await app.evaluate((electronModule, dir) => {
      electronModule.app.setPath('appData', dir);
    }, tempDir);

    window = await app.firstWindow();
    await window.waitForLoadState('networkidle');
    const elements = await window.$$('#app > *');
    expect(elements).to.not.be.empty;

    await app.evaluate(
      (electronModule, [newViewport, browserWindow]) => {
        if (newViewport.label === 'default') {
          return;
        }

        browserWindow.setSize(newViewport.width, newViewport.height);
        // Wait a little to let the resize settle.
        return new Promise((resolve) => setTimeout(resolve, 500));
      },
      [viewport, await app.browserWindow(window)] as const
    );
  });

  afterEach(async () => {
    await app.close();
    app = null;
    window = null;
  });

  it('shows a single window', () => {
    expect(app.windows().length).to.equal(1);
  });

  it('has a title of untitled', async () => {
    await waitForExpect(() => {
      expect(window.title()).to.eventually.equal('Untitled');
    });
  });

  it('shows the basic components', async () => {
    const components = [
      await window.$('_react=Editor'),
      await window.$('_react=Menu'),
      await window.$('_react=Rhymes'),
    ];

    for (const component of components) {
      await expect(component.isVisible()).to.eventually.be.true;
    }
  });

  it('allows you to type in the editor', async () => {
    const editorTextArea = await window.$('.cm-content');
    await editorTextArea.type('Hello World!');

    await expect(editorTextArea.textContent()).to.eventually.equal(
      'Hello World!'
    );
  });

  addCommonUiTests(async () => ({
    page: window,
    screen: getQueriesForElement(await getDocument(window)),
  }));
});
