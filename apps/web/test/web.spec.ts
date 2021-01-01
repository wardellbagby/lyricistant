import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { BrowserObject, remote } from 'webdriverio';

use(chaiAsPromised);

describe('Webpage launch', () => {
  let client: BrowserObject;

  before(async () => {
    client = await remote({
      logLevel: 'debug',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--no-sandbox'],
        },
      },
    });
  });

  beforeEach(async () => {
    await client.url(
      pathToFileURL(path.resolve('apps', 'web', 'index.html')).toString()
    );
    return client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(() => client.closeWindow());

  after(() => client.deleteSession());

  it('has a title of Lyricistant - Untitled', () => {
    return expect(client.getTitle()).to.eventually.equal(
      'Lyricistant - Untitled'
    );
  });

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
    await (await client.$('.CodeMirror-lines')).click();
    const editorTextArea = await client.$('//textarea');
    await client.elementSendKeys(editorTextArea.elementId, 'Hello World!');

    expect(editorTextArea.getValue()).to.eventually.equal('Hello World!');
  });
});
