import path from 'path';
import addCommonUiTests, {
  findMenuButton,
  PlaywrightScreen,
} from '@lyricistant/common-ui-tests';
import {
  setup as setupServer,
  teardown as stopServer,
} from 'jest-process-manager';
import { flatMap } from 'lodash';
import {
  BrowserContext,
  BrowserType,
  chromium,
  firefox,
  Page,
  webkit,
} from 'playwright';
import {
  getDocument,
  getQueriesForElement,
  waitFor,
} from 'playwright-testing-library';
import waitForExpect from 'wait-for-expect';

interface Viewport {
  width: number;
  height: number;
  isSmallLayout: boolean;
}

interface Browser {
  type: BrowserType;
  label: string;
  args?: string[];
}

const viewports: Viewport[] = [
  {
    width: 360,
    height: 780,
    isSmallLayout: true,
  },
  {
    width: 1200,
    height: 1200,
    isSmallLayout: false,
  },
];

const browsers: Browser[] = [
  { type: webkit, label: 'WebKit' },
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

const forceLegacyWebs = [false, true];

interface Arg {
  viewport: Viewport;
  browser: Browser;
  forceLegacyWeb: boolean;
}

const args: Arg[] = flatMap(forceLegacyWebs, (forceLegacyWeb) =>
  flatMap(viewports, (viewport) =>
    flatMap(browsers, (browser) => ({
      viewport,
      browser,
      forceLegacyWeb,
    }))
  )
);

const host = 'localhost';
const port = 8081;
describe.each(args)(
  'Web launch - $browser.label - $viewport.width x $viewport.height - forceLegacyWeb: $forceLegacyWeb',
  ({ viewport, browser, forceLegacyWeb }) => {
    let browserContext: BrowserContext;
    let page: Page;
    let screen: PlaywrightScreen;

    beforeAll(async () => {
      await setupServer({
        command: `http-server "${path.resolve(
          'apps',
          'web',
          'dist',
          'test'
        )}" --port ${port} -a ${host}`,
        port,
        usedPortAction: process.env.CI ? 'kill' : 'ask',
      });
      browserContext = await browser.type.launchPersistentContext('', {
        headless: !!!process.env.PWDEBUG,
        viewport,
        args: browser.args,
      });
    });

    beforeEach(async () => {
      page = await browserContext.newPage();
      await page.goto(`http://${host}:${port}?forceLegacy=${!forceLegacyWeb}`);
      await page.waitForLoadState('networkidle');
      screen = getQueriesForElement(await getDocument(page));
    });

    afterEach(async () => {
      await page.evaluate(() => window.localStorage.clear());
      await page.evaluate(() => window.sessionStorage.clear());
      await page.close();
    });

    afterAll(async () => {
      await stopServer();
      await browserContext.close();
    });

    it('has a title of Lyricistant - Untitled', async () => {
      await waitForExpect(
        async () =>
          await expect(page.title()).resolves.toBe('Lyricistant - Untitled')
      );
    });

    it('shows the basic components', async () => {
      const components = [
        await page.$('_react=Editor'),
        await page.$('_react=Menu'),
        await page.$('_react=Rhymes'),
      ];

      for (const component of components) {
        await expect(component.isVisible()).resolves.toBeTruthy();
      }
    });

    it('allows you to type in the editor', async () => {
      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type('Hello World!');

      await expect(editorTextArea.textContent()).resolves.toBe('Hello World!');
    });

    it('shows downloads', async () => {
      await expect(
        screen.queryByText('Download Lyricistant')
      ).resolves.toBeNull();

      const settings = await findMenuButton(
        screen,
        'Download Lyricistant',
        viewport.isSmallLayout
      );
      await settings.click();

      await expect(
        screen.queryAllByText('Download Lyricistant')
      ).resolves.toBeTruthy();

      const close = await screen.findByRole('button', { name: 'Close' });
      await close.click();

      await waitFor(async () =>
        expect(
          screen.queryAllByText('Download Lyricistant')
        ).resolves.toBeEmpty()
      );
    });

    addCommonUiTests(async () => ({
      page,
      screen,
      isSmallLayout: viewport.isSmallLayout,
    }));
  }
);
