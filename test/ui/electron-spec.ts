import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Application, SpectronClient } from 'spectron';

use(chaiAsPromised);

describe('Application launch', function() {
  this.timeout(10000);
  let app: Application;
  let client: SpectronClient;

  beforeEach(() => {
    app = new Application({
      path: 'dist/electron-app/mac/Lyricistant.app/Contents/MacOS/Lyricistant'
    });
    return app
      .start()
      .then(() => app.client.waitUntilWindowLoaded())
      .then(() => {
        client = app.client;
        app.client.waitUntil(async () => {
          const elements = await app.client.$$('#app > *');
          return elements.length > 0;
        });
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

  it('shows the basic components', () => {
    return Promise.all([
      expect(client.react$('Editor')).to.eventually.be.not.null,
      expect(client.react$('Menu')).to.eventually.be.not.null,
      expect(client.react$('Rhymes')).to.eventually.be.not.null
    ]);
  });
});
