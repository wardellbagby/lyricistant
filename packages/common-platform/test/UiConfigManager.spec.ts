import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';

use(sinonChai);

describe('Ui Config Manager', () => {
  let manager: UiConfigManager;
  let fileManager: StubbedInstance<FileManager>;
  let uiConfigProvider: UiConfigProvider;
  let formatTitle: TitleFormatter;

  const rendererDelegate = new MockRendererDelegate();
  let fileChangedListener: (filename: string, recents: string[]) => void;

  beforeEach(() => {
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
    rendererDelegate.clear();
  });

  it('registers on the renderer delegate the events it cares about', () => {
    manager.register();

    expect(
      rendererDelegate.addRendererListenerSetListener
    ).to.have.been.calledWith('ui-config');
  });

  it('sends ui config when requested', () => {
    manager.register();

    rendererDelegate.invokeRendererListenerSetListener('ui-config');

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
