import { RendererDelegate } from '@common/Delegates';
import { FileManager } from '@common/files/FileManager';
import { TitleFormatter, UiConfigProvider } from '@common/ui/UiConfig';
import { UiConfigManager } from '@common/ui/UiConfigManager';
import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import { RendererListeners } from '@testing/utilities/Listeners';

use(sinonChai);

describe('Ui Config Manager', () => {
  let manager: UiConfigManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let fileManager: StubbedInstance<FileManager>;
  let uiConfigProvider: UiConfigProvider;
  let formatTitle: TitleFormatter;

  const rendererListeners = new RendererListeners();
  let fileChangedListener: (filename: string, recents: string[]) => void;

  beforeEach(() => {
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    fileManager = stubInterface<FileManager>();
    fileManager.addOnFileChangedListener.callsFake((listener) => {
      fileChangedListener = listener;
    });
    uiConfigProvider = sinon.fake.returns({
      showDownload: true,
      showOpen: true,
    });
    formatTitle = sinon.fake.returns('Wow!');

    manager = new UiConfigManager(
      rendererDelegate,
      uiConfigProvider,
      formatTitle,
      fileManager
    );
  });

  afterEach(() => {
    rendererListeners.clear();
  });

  it('registers on the renderer delegate the events it cares about', () => {
    manager.register();

    expect(rendererDelegate.on).to.have.been.calledWith('request-ui-config');
  });

  it('sends ui config when requested', () => {
    manager.register();

    rendererListeners.invoke('request-ui-config');

    expect(rendererDelegate.send).to.have.been.calledWith('ui-config', {
      showDownload: true,
      showOpen: true,
    });
  });

  it('updates app title when file changed', () => {
    manager.register();

    fileChangedListener('new file!', []);

    expect(rendererDelegate.send).to.have.been.calledWith(
      'app-title-changed',
      'Wow!'
    );
  });
});
