import path from 'path';
import { pathToFileURL } from 'url';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BrowserContext, chromium, JSHandle, Page } from 'playwright';
import {
  ColorScheme,
  Font,
  ThemeData,
} from '@lyricistant/common/preferences/PreferencesData';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { FileHistory } from '@lyricistant/common/history/FileHistory';
import { DateTime } from 'luxon';

use(chaiAsPromised);

interface Device {
  name: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceScaleFactor: number;
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
  },
  {
    name: 'ipadPro',
    viewport: {
      width: 1366,
      height: 1024,
    },
    deviceScaleFactor: 2,
  },
  {
    name: 'iPhone13ProMax',
    viewport: {
      width: 428,
      height: 926,
    },
    deviceScaleFactor: 3,
  },
  {
    name: 'iPhone8Plus',
    viewport: {
      width: 414,
      height: 736,
    },
    deviceScaleFactor: 3,
  },
  {
    name: 'androidPhone',
    viewport: {
      width: 393,
      height: 851,
    },
    deviceScaleFactor: 2.75,
  },
  {
    name: 'androidTablet',
    viewport: {
      width: 1138,
      height: 712,
    },
    deviceScaleFactor: 2.25,
  },
];

const lyrics =
  "Bury me loose.\nI ain't ever been about the views;\nTell 'em bury me loose.\nAnd don't let 'em give you no excuse.\nJust tell 'em, tell 'em bury me loose.";
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