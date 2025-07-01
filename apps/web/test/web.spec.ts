import path from 'path';
import addCommonUiTests, {
  findMenuButton,
  useMockDefinitions,
  useMockRhymes,
} from '@lyricistant/common-ui-tests';
import getPort from 'get-port';
import {
  setup as setupServer,
  teardown as stopServer,
} from 'jest-process-manager';
import { BrowserContext, Page } from 'playwright';
import { waitFor } from 'playwright-testing-library';
import waitForExpect from 'wait-for-expect';
import { getSpecs } from './ui-test-specs';

const { specs } = getSpecs();
const host = 'localhost';

describe.each(specs)(
  'Web launch - $browser.label - $viewport.width x $viewport.height - forceLegacyWeb: $forceLegacyWeb',
  ({ viewport, browser, forceLegacyWeb }) => {
    let browserContext: BrowserContext | null;
    let page: Page;
    let port: number;

    beforeAll(async () => {
      port = await getPort();
      await setupServer({
        command: `http-server "${path.resolve(
          'apps',
          'web',
          'dist',
          'test',
        )}" --port ${port} -a ${host}`,
        port,
        usedPortAction: 'error',
      });
    });

    beforeEach(async () => {
      browserContext = await browser.type.launchPersistentContext('', {
        headless: !process.env.PWDEBUG,
        viewport,
        args: browser.args,
      });
      await useMockRhymes(browserContext);
      await useMockDefinitions(browserContext);

      page = await browserContext?.newPage();

      await Promise.all([
        page.goto(`http://${host}:${port}?forceLegacy=${!forceLegacyWeb}`, {
          waitUntil: 'networkidle',
        }),
        page.waitForSelector('#preload-overlay', { state: 'hidden' }),
      ]);
    });

    afterEach(async () => {
      await page?.evaluate(() => window.localStorage.clear());
      await page?.evaluate(() => window.sessionStorage.clear());
      await page?.close();
      await browserContext?.close();
    });

    afterAll(async () => {
      await stopServer();
      await browserContext?.close();
    });

    it('has a title of Lyricistant', async () => {
      await waitForExpect(
        async () => await expect(page.title()).resolves.toBe('Lyricistant'),
      );
    });

    it('shows downloads', async () => {
      await expect(
        page.getByText('Download Lyricistant').count(),
      ).resolves.toBe(0);

      const settings = await findMenuButton(page, 'Download Lyricistant');
      await settings.click();

      await expect(
        page.getByText('Download Lyricistant').count(),
      ).resolves.toBeGreaterThan(0);

      const close = page.getByRole('button', { name: 'Close' });
      await close.click();

      await waitFor(async () =>
        expect(
          page.getByText('Download Lyricistant').count(),
        ).resolves.toBeGreaterThan(0),
      );
    });

    addCommonUiTests(async () => ({
      page,
    }));
  },
);
