import path from 'path';
import addCommonUiTests, {
  findMenuButton,
  PlaywrightScreen,
  useMockDefinitions,
  useMockRhymes,
} from '@lyricistant/common-ui-tests';
import getPort from 'get-port';
import {
  setup as setupServer,
  teardown as stopServer,
} from 'jest-process-manager';
import { BrowserContext, Page } from 'playwright';
import {
  getDocument,
  getQueriesForElement,
  waitFor,
} from 'playwright-testing-library';
import waitForExpect from 'wait-for-expect';
import { getSpecs } from './ui-test-specs';

const { specs } = getSpecs();
const host = 'localhost';

describe.each(specs)(
  'Web launch - $browser.label - $viewport.width x $viewport.height - forceLegacyWeb: $forceLegacyWeb',
  ({ viewport, browser, forceLegacyWeb }) => {
    let browserContext: BrowserContext;
    let page: Page;
    let screen: PlaywrightScreen;
    let port: number;

    beforeAll(async () => {
      port = await getPort();
      await setupServer({
        command: `http-server "${path.resolve(
          'apps',
          'web',
          'dist',
          'test'
        )}" --port ${port} -a ${host}`,
        port,
        usedPortAction: 'error',
      });
      browserContext = await browser.type.launchPersistentContext('', {
        headless: !!!process.env.PWDEBUG,
        viewport,
        args: browser.args,
      });

      await useMockRhymes(browserContext);
      await useMockDefinitions(browserContext);
    });

    beforeEach(async () => {
      page = await browserContext.newPage();
      await page.goto(`http://${host}:${port}?forceLegacy=${!forceLegacyWeb}`, {
        waitUntil: 'networkidle',
      });
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

    it('has a title of Lyricistant', async () => {
      await waitForExpect(
        async () => await expect(page.title()).resolves.toBe('Lyricistant')
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
      await editorTextArea.type('Hello World!', { delay: 10 });

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
