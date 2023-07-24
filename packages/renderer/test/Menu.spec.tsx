import { expect, jest } from '@jest/globals';
import { Menu as RealMenu, MenuProps } from '@lyricistant/renderer/menu/Menu';
import { configure } from '@testing-library/dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { render } from './Wrappers';

describe('Menu component', () => {
  let platformDelegate: MockPlatformDelegate;

  beforeEach(async () => {
    configure({
      getElementError: (message) => {
        const error = new Error(message);
        error.name = 'TestingLibraryElementError';
        return error;
      },
    });
    platformDelegate = new MockPlatformDelegate();

    window.platformDelegate = platformDelegate;
    window.logger = new MockLogger();
  });

  afterEach(() => {
    platformDelegate.clear();
    jest.resetAllMocks();
  });

  it('tells the platform when user attempts to make a new file', async () => {
    const onNewClicked = jest.fn();
    render(<Menu onNewClicked={onNewClicked} />);

    const element = screen.getByRole('button', { name: 'New file' });
    await userEvent.click(element);

    expect(onNewClicked).toHaveBeenCalled();
  });

  it('tells the platform when user attempts to open a file', async () => {
    const onOpenClicked = jest.fn();
    render(<Menu onOpenClicked={onOpenClicked} />);

    await platformDelegate.invoke('ui-config', {
      showOpen: true,
      showDownload: false,
      showBrowserWarning: false,
      promptOnUrlChange: true,
    });

    const element = screen.getByRole('button', { name: 'Open file' });
    await userEvent.click(element);

    await expect(onOpenClicked).toHaveBeenCalled();
  });

  it('tells the platform when user attempts to save a file', async () => {
    const onSaveClicked = jest.fn();
    render(<Menu onSaveClicked={onSaveClicked} />);

    const element = screen.getByRole('button', { name: 'Save file' });
    await userEvent.click(element);

    await expect(onSaveClicked).toHaveBeenCalled();
  });

  it('goes to preferences when clicked', async () => {
    const onPreferencesClicked = jest.fn();

    render(<Menu onPreferencesClicked={onPreferencesClicked} />);
    const element = screen.getByRole('button', { name: 'Open preferences' });
    await userEvent.click(element);

    await expect(onPreferencesClicked).toHaveBeenCalled();
  });

  it('goes to download app when clicked', async () => {
    const onDownloadClicked = jest.fn();

    render(<Menu onDownloadClicked={onDownloadClicked} />);

    await platformDelegate.invoke('ui-config', {
      showOpen: false,
      showDownload: true,
      showBrowserWarning: false,
      promptOnUrlChange: true,
    });

    const element = screen.getByRole('button', {
      name: 'Download Lyricistant',
    });
    await userEvent.click(element);

    expect(onDownloadClicked).toHaveBeenCalled();
  });

  const Menu = (props: Partial<MenuProps>) => (
    <RealMenu
      onNewClicked={jest.fn()}
      onOpenClicked={jest.fn()}
      onSaveClicked={jest.fn()}
      onPreferencesClicked={jest.fn()}
      onDownloadClicked={jest.fn()}
      onFileHistoryClicked={jest.fn()}
      onReadOnlyToggled={jest.fn()}
      {...props}
    />
  );
});
