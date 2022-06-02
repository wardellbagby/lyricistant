import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { RendererListeners } from '@testing/utilities/Listeners';
import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Ui Config Manager', () => {
  let manager: UiConfigManager;
  let rendererDelegate: StubbedInstance<RendererDelegate>;
  let fileManager: StubbedInstance<FileManager>;
  let uiConfigProvider: UiConfigProvider;
  let formatTitle: TitleFormatter;

  const rendererListeners = new RendererListeners();
  const rendererListenersSetListeners: Map<string, () => void> = new Map();
  let fileChangedListener: (filename: string, recents: string[]) => void;

  beforeEach(() => {
    rendererDelegate = stubInterface();
    rendererDelegate.on.callsFake(function (channel, listener) {
      rendererListeners.set(channel, listener);
      return this;
    });
    rendererDelegate.addRendererListenerSetListener.callsFake(
      (channel, onRendererListenerSet) => {
        rendererListenersSetListeners.set(channel, onRendererListenerSet);
      }
    );
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

    expect(
      rendererDelegate.addRendererListenerSetListener
    ).to.have.been.calledWith('ui-config');
  });

  it('sends ui config when requested', () => {
    manager.register();

    rendererListenersSetListeners.get('ui-config')();

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
