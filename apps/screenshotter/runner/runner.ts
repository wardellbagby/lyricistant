import expect from 'expect';
import path from 'path';
import { pathToFileURL } from 'url';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import {
  ColorScheme,
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import {
  useMockDefinitions,
  useMockRhymes,
} from '@lyricistant/common-ui-tests';
import { ScreenshotterPreferences } from '@screenshotter-app/platform/Preferences';
import chaiAsPromised from 'chai-as-promised';
import { DateTime } from 'luxon';
import { BrowserContext, chromium, JSHandle, Page } from 'playwright';

use(chaiAsPromised);

interface Device {
  name: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceScaleFactor: number;
  isMobile?: boolean;
}

const devices: Device[] = [
  {
    name: 'electron',
    viewport: {
      width: 1000,
      height: 720,
    },
    deviceScaleFactor: 2.75,
  },
  {
    name: 'ipadPro129',
    viewport: {
      width: 1366,
      height: 1024,
    },
    deviceScaleFactor: 2,
    isMobile: true,
  },
  {
    name: 'ipadPro',
    viewport: {
      width: 1366,
      height: 1024,
    },
    deviceScaleFactor: 2,
    isMobile: true,
  },
  {
    name: 'iPhone13ProMax',
    viewport: {
      width: 428,
      height: 926,
    },
    deviceScaleFactor: 3,
    isMobile: true,
  },
  {
    name: 'iPhone8Plus',
    viewport: {
      width: 414,
      height: 736,
    },
    deviceScaleFactor: 3,
    isMobile: true,
  },
  {
    name: 'androidPhone',
    viewport: {
      width: 393,
      height: 851,
    },
    deviceScaleFactor: 2.75,
    isMobile: true,
  },
  {
    name: 'androidTablet',
    viewport: {
      width: 1138,
      height: 712,
    },
    deviceScaleFactor: 2.25,
    isMobile: true,
  },
];

const lyrics = [
  "I've been helpless to your loving.",
  'Got me restless for your touch.',
  "And it's been you since",
  'Before I knew, I knew.',
].join('\n');
const expectedLyrics = lyrics.replaceAll('\n', '');

const screenshotDate = DateTime.local(2019, 7, 22, 9, 0, 0, 0);

devices.forEach((device) => {
  describe(`Screenshot ${device.name}`, function () {
    let browser: BrowserContext;
    let page: Page;
    let rendererDelegate: JSHandle<RendererDelegate>;
    let fileHistory: JSHandle<FileHistory>;

    this.timeout('120s');

    const screenshot = async (index: number) => {
      await page.screenshot({
        path: path.resolve(__dirname, 'dist', `${index}-${device.name}.png`),
      });
    };

    beforeAll(async () => {
      browser = await chromium.launchPersistentContext('', {
        ...device,
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--enable-logging',
          '--allow-file-access-from-files',
        ],
      });

      await useMockRhymes(browser);
      await useMockDefinitions(browser);
    });

    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto(
        pathToFileURL(
          path.resolve('apps/screenshotter/dist/development/index.html'),
        ).toString(),
        {
          waitUntil: 'networkidle',
        },
      );
      rendererDelegate = (await page.evaluateHandle(
        () => window.rendererDelegate,
      )) as JSHandle<RendererDelegate>;
      fileHistory = (await page.evaluateHandle(
        () => window.fileHistory,
      )) as JSHandle<FileHistory>;
      await page.evaluate((mobile) => {
        const prefs: ScreenshotterPreferences = window.preferences;
        prefs.showToggleButton(!!mobile);
      }, device.isMobile);
    });

    afterEach(async () => {
      await page.evaluate(() => window.localStorage.clear());
      await page.evaluate(() => window.sessionStorage.clear());
      await page.close();
    });

    afterAll(async () => {
      await browser.close();
    });

    it('screenshots dark mode with lyrics!', async () => {
      await rendererDelegate.evaluate(
        (delegate, themeData) => {
          delegate.send('theme-updated', themeData);
        },
        {
          colorScheme: ColorScheme.Dark,
          font: Font.Roboto,
          textSize: 16,
        } as ThemeData,
      );

      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics, { delay: 10 });
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).toBe(expectedLyrics);

      await screenshot(1);
    });

    it('screenshots light mode with lyrics', async () => {
      await rendererDelegate.evaluate(
        (delegate, themeData) => {
          delegate.send('theme-updated', themeData);
        },
        {
          colorScheme: ColorScheme.Light,
          font: Font.Roboto,
          textSize: 16,
        } as ThemeData,
      );

      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics, { delay: 10 });
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).toBe(expectedLyrics);

      await screenshot(2);
    });

    it('screenshots showing dictionary', async () => {
      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics, { delay: 10 });
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).toBe(expectedLyrics);

      await page.click("[aria-label='Dictionary Tab']");
      await page.waitForTimeout(2000);

      await screenshot(3);
    });

    it('screenshots file history', async () => {
      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics, { delay: 10 });
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).toBe(expectedLyrics);

      await fileHistory.evaluate(
        (history, data) => {
          history.deserialize({
            version: 1,
            data,
          });
        },
        JSON.stringify([
          {
            time: screenshotDate.minus({
              days: 10,
            }),
            patches: [],
          },
          {
            time: screenshotDate.minus({
              days: 8,
            }),
            patches: [],
          },
          {
            time: screenshotDate.minus({
              days: 5,
            }),
            patches: [],
          },
          {
            time: screenshotDate.minus({
              days: 2,
            }),
            patches: [],
          },
          {
            time: screenshotDate,
            patches: [],
          },
        ]),
      );

      const overflowMenuButton = await page.locator(
        "[aria-label='Additional Menu Buttons']",
      );
      if (await overflowMenuButton.isVisible()) {
        await overflowMenuButton.click();
      }

      await page.click("[aria-label='View file history']");
      await page.waitForTimeout(2000);

      await screenshot(4);
    });

    it('screenshots preferences', async () => {
      const overflowMenuButton = await page.locator(
        "[aria-label='Additional Menu Buttons']",
      );
      if (await overflowMenuButton.isVisible()) {
        await overflowMenuButton.click();
      }

      await page.click("[aria-label='Open preferences']");
      await page.waitForTimeout(2000);

      await screenshot(5);
    });
  });
});
