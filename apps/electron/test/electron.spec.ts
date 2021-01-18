import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { Application, SpectronClient } from 'spectron';

use(chaiAsPromised);

describe('Electron launch', () => {
  let app: Application;
  let client: SpectronClient;

  beforeEach(async () => {
    app = new Application({
      path: require.resolve('electron/cli'),
      args: ['main.js', '--no-sandbox', '--disable-gpu', '--enable-logging'],
      cwd: path.resolve('apps', 'electron'),
    });

    await app.start();
    await app.client.waitUntilWindowLoaded();
    client = app.client;
    await client.waitUntil(async () => {
      const elements = await client.$$('#app > *');
      return elements.length > 0;
    });
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await client.closeWindow();
      app.mainProcess.exit(0);
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

  it('allows you to type in the editor', async () => {
    await (await client.$('.CodeMirror-lines')).click();
    const editorTextArea = await client.$('//textarea');
    await client.elementSendKeys(editorTextArea.elementId, 'Hello World!');

    expect(editorTextArea.getValue()).to.eventually.equal('Hello World!');
  });
});
