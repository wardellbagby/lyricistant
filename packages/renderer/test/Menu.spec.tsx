import React from 'react';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, use } from 'chai';
import { configure } from '@testing-library/dom';
import { restore, stub } from 'sinon';
import sinonChai from 'sinon-chai';
import { Router } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
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
    render(<Menu />);

    const element = screen.getByRole('button', { name: 'New File' });
    userEvent.click(element);

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWith('new-file-attempt')
    );
  });

  it('tells the platform when user attempts to open a file', async () => {
    render(<Menu />);

    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: true,
        showDownload: false,
        showBrowserWarning: false,
      })
    );
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Open File' })
    );
    userEvent.click(element);

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWith('open-file-attempt')
    );
  });

  it('tells the platform when user attempts to save a file', async () => {
    stub(
      require('@lyricistant/renderer/editor/EditorTextStore'),
      'useEditorText'
    ).returns('Text!');

    render(<Menu />);
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Save File' })
    );
    userEvent.click(element);

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWith(
        'save-file-attempt',
        'Text!'
      )
    );
  });

  it('goes to preferences when clicked', async () => {
    const history: History = createMemoryHistory();

    render(
      <Router history={history}>
        <Menu />
      </Router>
    );
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Open Preferences' })
    );
    userEvent.click(element);

    await waitFor(() =>
      expect(history.location.pathname).to.equal('/preferences')
    );
  });

  it("goes to download app when clicked and we couldn't auto-download", async () => {
    stub(require('@lyricistant/renderer/download'), 'downloadApp').returns(
      false
    );
    const history: History = createMemoryHistory();

    render(
      <Router history={history}>
        <Menu />
      </Router>
    );
    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: false,
        showDownload: true,
        showBrowserWarning: false,
      })
    );

    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Download Lyricistant' })
    );
    userEvent.click(element);

    await waitFor(() =>
      expect(history.location.pathname).to.equal('/download')
    );
  });

  it('does not go to download app when clicked and we could auto-download', async () => {
    stub(require('@lyricistant/renderer/download'), 'downloadApp').returns(
      true
    );
    const history: History = createMemoryHistory();

    render(
      <Router history={history}>
        <Menu />
      </Router>
    );
    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: false,
        showDownload: true,
        showBrowserWarning: false,
      })
    );

    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Download Lyricistant' })
    );
    userEvent.click(element);

    await waitFor(() => expect(history.location.pathname).to.equal('/'));
  });
});
