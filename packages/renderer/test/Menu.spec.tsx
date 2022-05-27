import { Menu as RealMenu, MenuProps } from '@lyricistant/renderer/menu/Menu';
import { configure } from '@testing-library/dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, use } from 'chai';
import React from 'react';
import { restore, stub } from 'sinon';
import sinonChai from 'sinon-chai';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { render } from './Wrappers';

use(sinonChai);

describe('Menu component', () => {
  let platformDelegate: MockPlatformDelegate;

  beforeEach(async () => {
    viewport.set(1200, 1200);
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
    restore();
  });

  it('tells the platform when user attempts to make a new file', async () => {
    const onNewClicked = stub();
    render(<Menu onNewClicked={onNewClicked} />);

    const element = screen.getByRole('button', { name: 'New File' });
    await userEvent.click(element);

    await waitFor(() => expect(onNewClicked).to.have.been.called);
  });

  it('tells the platform when user attempts to open a file', async () => {
    const onOpenClicked = stub();
    render(<Menu onOpenClicked={onOpenClicked} />);

    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: true,
        showDownload: false,
        showBrowserWarning: false,
        promptOnUrlChange: true,
      })
    );
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Open File' })
    );
    await userEvent.click(element);

    await waitFor(() => expect(onOpenClicked).to.have.been.called);
  });

  it('tells the platform when user attempts to save a file', async () => {
    const onSaveClicked = stub();
    render(<Menu onSaveClicked={onSaveClicked} />);

    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Save File' })
    );
    await userEvent.click(element);

    await waitFor(() => expect(onSaveClicked).to.have.been.called);
  });

  it('goes to preferences when clicked', async () => {
    const onPreferencesClicked = stub();

    render(<Menu onPreferencesClicked={onPreferencesClicked} />);
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Open Preferences' })
    );
    await userEvent.click(element);

    await waitFor(() => expect(onPreferencesClicked).to.have.been.called);
  });

  it('goes to download app when clicked', async () => {
    const onDownloadClicked = stub();

    render(<Menu onDownloadClicked={onDownloadClicked} />);
    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: false,
        showDownload: true,
        showBrowserWarning: false,
        promptOnUrlChange: true,
      })
    );

    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Download Lyricistant' })
    );
    await userEvent.click(element);

    await waitFor(() => expect(onDownloadClicked).to.have.been.called);
  });

  const Menu = (props: Partial<MenuProps>) => (
    <RealMenu
      onNewClicked={stub()}
      onOpenClicked={stub()}
      onSaveClicked={stub()}
      onPreferencesClicked={stub()}
      onDownloadClicked={stub()}
      onFileHistoryClicked={stub()}
      {...props}
    />
  );
});
