import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { BrowserObject, remote } from 'webdriverio';

use(chaiAsPromised);

describe('Webpage launch', function() {
  let client: BrowserObject;

  this.timeout(10000);

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

  it('shows the basic components', () => {
    return Promise.all([
      expect(client.react$('Editor')).to.eventually.be.not.null,
      expect(client.react$('Menu')).to.eventually.be.not.null,
      expect(client.react$('Rhymes')).to.eventually.be.not.null
    ]);
  });
});
