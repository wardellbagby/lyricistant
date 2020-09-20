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
      logLevel: 'warn',
      capabilities: {
        browserName: 'chrome'
      }
    });
  });

  beforeEach(() => {
    client.url(pathToFileURL(path.resolve('dist/web/index.html')).toString());
    return client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(() => client.closeWindow());

  after(() => client.deleteSession());

  it('has a title of untitled', () => {
    return expect(client.getTitle()).to.eventually.equal('Untitled');
  });

  it('shows the basic components', async () => {
    const components = [
      await client.react$('Editor'),
      await client.react$('Menu'),
      await client.react$('Rhymes')
    ];

    for (const component of components) {
      await expect(component.waitForDisplayed()).to.eventually.be.true;
    }
  });
});
