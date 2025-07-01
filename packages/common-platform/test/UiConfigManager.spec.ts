import expect from 'expect';
import { FileManager } from '@lyricistant/common-platform/files/FileManager';
import { UiConfigManager } from '@lyricistant/common-platform/ui/UiConfigManager';
import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';
import { MockRendererDelegate } from '@testing/utilities/MockRendererDelegate';
import { mockDeep, MockProxy } from 'jest-mock-extended';

describe('Ui Config Manager', () => {
  let manager: UiConfigManager;
  let fileManager: MockProxy<FileManager>;
  let uiConfigProvider: UiConfigProvider;
  let formatTitle: TitleFormatter;

  const rendererDelegate = new MockRendererDelegate();
  let fileChangedListener: (filename: string, recents: string[]) => void;

  beforeEach(() => {
    fileManager = mockDeep<FileManager>();
    fileManager.addOnFileChangedListener.mockImplementation((listener) => {
      fileChangedListener = listener;
    });
    uiConfigProvider = jest.fn().mockReturnValue({
      showDownload: true,
      showOpen: true,
    });
    formatTitle = jest.fn().mockReturnValue('Wow!');

    manager = new UiConfigManager(
      rendererDelegate,
      uiConfigProvider,
      formatTitle,
      fileManager,
    );
  });

  afterEach(() => {
    rendererDelegate.clear();
  });

  it('registers on the renderer delegate the events it cares about', () => {
    manager.register();

    expect(
      rendererDelegate.addRendererListenerSetListener,
    ).toHaveBeenCalledWith('ui-config', expect.anything());
  });

  it('sends ui config when requested', () => {
    manager.register();

    rendererDelegate.invokeRendererListenerSetListener('ui-config');

    expect(rendererDelegate.send).toHaveBeenCalledWith('ui-config', {
      showDownload: true,
      showOpen: true,
    });
  });

  it('updates app title when file changed', () => {
    manager.register();

    fileChangedListener('new file!', []);

    expect(rendererDelegate.send).toHaveBeenCalledWith(
      'app-title-changed',
      'Wow!',
    );
  });
});
