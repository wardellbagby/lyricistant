import path from 'path';
import { pathToFileURL } from 'url';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BrowserContext, chromium, devices, JSHandle, Page } from 'playwright';
import {
  ColorScheme,
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileHistory } from '@lyricistant/common/history/FileHistory';
import { DateTime } from 'luxon';

use(chaiAsPromised);

type Device = typeof devices[0] & { name: string };
const selectedDevices: Device[] = [
  {
    name: 'electron',
    userAgent: '',
    viewport: {
      width: 1000,
      height: 720,
    },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  },
  { ...devices['Pixel 5'], name: 'androidPhone' },
  { ...devices['Galaxy Tab S4 landscape'], name: 'androidTablet' },
  { ...devices['iPhone 13 Pro Max'], name: 'iPhone13ProMax' },
  { ...devices['iPhone 8 Plus'], name: 'iPhone8Plus' },
  {
    name: 'ipadPro129',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 1366,
      height: 1024,
    },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit',
  },
  {
    name: 'ipadPro',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 1366,
      height: 1024,
    },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit',
  },
];
const lyrics =
  "Bury me loose.\nI ain't ever been about the views;\nTell 'em bury me loose.\nAnd don't let 'em give you no excuse.\nJust tell 'em, tell 'em bury me loose.";
const expectedLyrics = lyrics.replaceAll('\n', '');

const random = (min: number, max: number) => Math.random() * (max - min) + min;

selectedDevices.forEach((device) => {
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

    before(async () => {
      browser = await chromium.launchPersistentContext('', {
        ...device,
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
        pathToFileURL(
          path.resolve('apps/screenshotter/dist/development/index.html')
        ).toString()
      );
      await page.waitForLoadState('networkidle');
      rendererDelegate = (await page.evaluateHandle(
        () => (window as any).rendererDelegate
      )) as JSHandle<RendererDelegate>;
      fileHistory = (await page.evaluateHandle(
        () => (window as any).fileHistory
      )) as JSHandle<FileHistory>;
    });

    afterEach(async () => {
      await page.evaluate(() => window.localStorage.clear());
      await page.evaluate(() => window.sessionStorage.clear());
      await page.close();
    });

    after(async () => {
      await browser.close();
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
        } as ThemeData
      );

      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics);
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).to.eventually.equal(
        expectedLyrics
      );

      await screenshot(1);
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
        } as ThemeData
      );

      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics);
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).to.eventually.equal(
        expectedLyrics
      );

      await screenshot(2);
    });

    it('screenshots showing more lyrics', async () => {
      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics);
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).to.eventually.equal(
        expectedLyrics
      );

      await page.click("[aria-label='Show All Rhymes']");
      await page.waitForTimeout(1000);

      await screenshot(3);
    });

    it('screenshots file history', async () => {
      const editorTextArea = await page.$('.cm-content');
      await editorTextArea.type(lyrics);
      await page.waitForTimeout(2000);

      await expect(editorTextArea.textContent()).to.eventually.equal(
        expectedLyrics
      );

      await fileHistory.evaluate(
        (history, data) => {
          history.deserialize({
            version: 1,
            data,
          });
        },
        JSON.stringify([
          {
            time: DateTime.local().minus({
              days: 10,
              hours: random(0, 23),
              minute: random(0, 60),
              second: random(0, 60),
            }),
            patches: [],
          },
          {
            time: DateTime.local().minus({
              days: 8,
              hours: random(0, 23),
              minute: random(0, 60),
              second: random(0, 60),
            }),
            patches: [],
          },
          {
            time: DateTime.local().minus({
              days: 5,
              hours: random(0, 23),
              minute: random(0, 60),
              second: random(0, 60),
            }),
            patches: [],
          },
          {
            time: DateTime.local().minus({
              days: 2,
              hours: random(0, 23),
              minute: random(0, 60),
              second: random(0, 60),
            }),
            patches: [],
          },
          {
            time: DateTime.local().minus({ hours: 6 }),
            patches: [],
          },
        ])
      );

      const overflowMenuButton = await page.locator(
        "[aria-label='Additional Menu Buttons']"
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
        "[aria-label='Additional Menu Buttons']"
      );
      if (await overflowMenuButton.isVisible()) {
        await overflowMenuButton.click();
      }

      await page.click("[aria-label='Open Preferences']");
      await page.waitForTimeout(2000);

      await screenshot(5);
    });
  });
});
