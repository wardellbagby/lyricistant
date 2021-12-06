import path from 'path';
import os from 'os';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import del from 'del';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

use(chaiAsPromised);

describe('Electron launch', () => {
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

    window = await app.firstWindow();
    await window.waitForLoadState('networkidle');
    const elements = await window.$$('#app > *');
    expect(elements).to.not.be.empty;
  });

  it('shows a single window', () => expect(app.windows().length).to.equal(1));

  it('has a title of untitled', () =>
    expect(window.title()).to.eventually.equal('Untitled'));

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
});
