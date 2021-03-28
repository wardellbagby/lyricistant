import path from 'path';
import { pathToFileURL } from 'url';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Browser, remote } from 'webdriverio';

use(chaiAsPromised);

describe('Webpage launch', () => {
  let client: Browser<'async'>;

  before(async () => {
    client = await remote({
      logLevel: 'warn',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--no-sandbox',
            '--disable-gpu',
            '--enable-logging',
            '--headless',
          ],
        },
      },
    });
  });

  beforeEach(async () => {
    await client.url(
      pathToFileURL(path.resolve('apps/web/dist/test/index.html')).toString()
    );
    return client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(() => client.closeWindow());

  after(() => client.deleteSession());

  it('has a title of Lyricistant - Untitled', () =>
    expect(client.getTitle()).to.eventually.equal('Lyricistant - Untitled'));

  it('shows the basic components', async () => {
    const components = [
      await client.react$('Editor'),
      await client.react$('Menu'),
      await client.react$('Rhymes'),
    ];

    for (const component of components) {
      await expect(component.waitForDisplayed()).to.eventually.be.true;
    }
  });

  it('allows you to type in the editor', async () => {
    const editorTextArea = await client.$('.cm-content');
    await client.elementSendKeys(editorTextArea.elementId, 'Hello World!');

    await expect(editorTextArea.getText()).to.eventually.equal('Hello World!');
  });
});
