import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { Application } from 'spectron';

use(chaiAsPromised);

describe('Application launch', function() {
  this.timeout(10000);
  let app: Application;

  beforeEach(() => {
    app = new Application({
      path: path.join(
        __dirname,
        '../../dist/electron-app/mac/Lyricistant.app/Contents/MacOS/Lyricistant'
      )
    });
    return app.start().then(() => app.client.waitUntilWindowLoaded());
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('shows an initial window', () => {
    return expect(app.client.getWindowCount()).to.eventually.equal(1);
  });

  it('has a title of untitled', () => {
    return expect(app.browserWindow.getTitle()).to.eventually.equal('Untitled');
  });
});
