import path from 'path';
import { pathToFileURL } from 'url';
import addCommonUiTests from '@lyricistant/common-ui-tests';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  BrowserContext,
  BrowserType,
  chromium,
  firefox,
  Page,
} from 'playwright';
import { getDocument, getQueriesForElement } from 'playwright-testing-library';

use(chaiAsPromised);

interface Viewport {
  width: number;
  height: number;
}
const viewports: Viewport[] = [
  {
    width: 360,
    height: 780,
  },
  {
    width: 1200,
    height: 1200,
  },
];

interface Browser {
  type: BrowserType;
  label: string;
  args?: string[];
}
const browsers: Browser[] = [
  { type: firefox, label: 'Firefox' },
  {
    type: chromium,
    label: 'Chromium',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--enable-logging',
      '--allow-file-access-from-files',
    ],
  },
];

interface Arg {
  viewport: Viewport;
  browser: Browser;
}

const args: Arg[] = viewports
  .map((viewport): Arg[] =>
    browsers.map((browser) => ({
      viewport,
      browser,
    }))
  )
  .reduce((value, total) => {
    total.push(...value);
    return total;
  }, []);

describe.each(args)(
  'Webpage launch - $viewport - $browser.label',
  ({ viewport, browser }) => {
    let browserContext: BrowserContext;
    let page: Page;

    beforeAll(async () => {
      browserContext = await browser.type.launchPersistentContext('', {
        headless: false,
        viewport,
        args: browser.args,
      });
    });

    beforeEach(async () => {
      page = await browserContext.newPage();
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
      await browserContext.close();
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

    addCommonUiTests(async () => ({
      page,
      screen: getQueriesForElement(await getDocument(page)),
    }));
  }
);
