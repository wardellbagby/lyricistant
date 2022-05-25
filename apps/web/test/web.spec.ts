import path from 'path';
import { pathToFileURL } from 'url';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BrowserContext, chromium, Page } from 'playwright';

use(chaiAsPromised);

describe('Webpage launch', () => {
  let browser: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--enable-logging',
        '--allow-file-access-from-files',
      ],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(
      pathToFileURL(path.resolve('apps/web/dist/test/index.html')).toString()
    );
    await page.waitForLoadState('networkidle');
  });

  afterEach(async () => {
    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate(() => window.sessionStorage.clear());
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('has a title of Lyricistant - Untitled', () =>
    expect(page.title()).to.eventually.equal('Lyricistant - Untitled'));

  it('shows the basic components', async () => {
    const components = [
      await page.$('_react=Editor'),
      await page.$('_react=Menu'),
      await page.$('_react=Rhymes'),
    ];

    for (const component of components) {
      await expect(component.isVisible()).to.eventually.be.true;
    }
  });

  it('allows you to type in the editor', async () => {
    const editorTextArea = await page.$('.cm-content');
    await editorTextArea.type('Hello World!');

    await expect(editorTextArea.textContent()).to.eventually.equal(
      'Hello World!'
    );
  });
});
