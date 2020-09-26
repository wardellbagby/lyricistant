import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Application, SpectronClient } from 'spectron';

use(chaiAsPromised);

describe('Electron launch', () => {
  let app: Application;
  let client: SpectronClient;

  beforeEach(async () => {
    app = new Application({
      path: 'dist/electron-app/mac/Lyricistant.app/Contents/MacOS/Lyricistant',
    });

    await app.start();
    await app.client.waitUntilWindowLoaded();
    client = app.client;
    return client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('shows an initial window', () => {
    return expect(client.getWindowCount()).to.eventually.equal(1);
  });

  it('has a title of untitled', () => {
    return expect(app.browserWindow.getTitle()).to.eventually.equal('Untitled');
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
});
