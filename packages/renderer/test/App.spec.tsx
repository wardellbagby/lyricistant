import {
  ColorScheme,
  DefaultFileType,
  Font,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { App as RealApp } from '@lyricistant/renderer/app/App';
import { configure, screen } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { render, wait } from './Wrappers';

describe('App component', () => {
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
  });

  it('updates the document title when the app title changes', async () => {
    render(<App />);

    await waitFor(() =>
      platformDelegate.invoke('app-title-changed', 'All I Need')
    );

    await waitFor(() => document.title);

    expect(document.title).to.equal('All I Need');
  });

  it('shows an error when files fail to open', async () => {
    render(<App />);

    await waitFor(() =>
      platformDelegate.invoke(
        'file-opened',
        new Error('oh no!'),
        undefined,
        false
      )
    );

    expect(screen.getByText("Couldn't open selected file.")).to.exist;
  });

  it('handles files being saved', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'Initially here');

    await expect(screen.getByText('Initially here')).to.exist;

    await platformDelegate.invoke('file-save-ended', undefined, 'apath.txt');

    await expect(screen.getByText('apath.txt saved')).to.exist;

    await platformDelegate.invoke('undo');
    expect(screen.getByText('Initially here')).to.exist;
  });

  it("handles the platform checking if file is modified when it isn't", async () => {
    render(<App />);

    await platformDelegate.invoke('check-file-modified');

    await waitFor(() => {
      expect(platformDelegate.send).to.have.been.calledWith(
        'is-file-modified',
        false
      );
    });
  });

  it('handles the platform checking if file is modified when user has made edits', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'oh no the printer jaaaaaaaaaaaaaammmmed');

    await waitFor(() => platformDelegate.invoke('check-file-modified'));

    await waitFor(() => {
      expect(platformDelegate.send).to.have.been.calledWith(
        'is-file-modified',
        true
      );
    });
  });

  it('handles the platform having created a new file', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'my loco pinocchio');

    await expect(screen.findByText('my loco pinocchio')).to.exist;

    await platformDelegate.invoke('new-file-created');

    await platformDelegate.invoke('undo');
    await expect(screen.queryByText('my loco pinocchio')).to.not.exist;
  });

  it('handles the platform having opened a file', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'ok! coo!');

    await expect(screen.getByText('ok! coo!')).to.exist;

    await platformDelegate.invoke('file-opened', null, 'coo coo...', true);

    await expect(await screen.findByText('coo coo...')).to.exist;

    await platformDelegate.invoke('undo');
    await expect(await screen.findByText('coo coo...')).to.exist;
  });

  it('handles the platform having opened a file but does not clear history', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'dot buzz backslash tight!');
    await expect(screen.getByText('dot buzz backslash tight!')).to.exist;
    // We need to wait here for CodeMirror to update its undo cache.
    await wait(1000);

    await platformDelegate.invoke('file-opened', null, 'de-ope!', false);

    await expect(await screen.findByText('de-ope!')).to.exist;
    await wait(1000);

    await platformDelegate.invoke('undo');
    await expect(await screen.findByText('dot buzz backslash tight!')).to.exist;
  });

  it('handles the platform asking for the editor text', async () => {
    render(<App />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'and the oscar goes to...');

    await platformDelegate.invoke('request-editor-text');

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWith(
        'editor-text',
        'and the oscar goes to...'
      )
    );
  });

  it('replaces words when rhymes are clicked', async () => {
    render(<App />);

    await platformDelegate.invoke('prefs-updated', {
      rhymeSource: RhymeSource.Offline,
      font: Font.Roboto,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      defaultFileType: DefaultFileType.Always_Ask,
    });

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'and the oscar goes to you...');

    expect(await screen.findByText('Test Rhyme 1')).to.exist;
    expect(await screen.findByText('Test Rhyme 2')).to.exist;

    await userEvent.click(screen.getByText('Test Rhyme 1'));

    expect(await screen.findByText('and the oscar goes to Test Rhyme 1...'));

    await userEvent.click(screen.getByText('Test Rhyme 2'));

    expect(await screen.findByText('and the oscar goes to Test Rhyme 2...'));
  });

  const App = () => (
    <MemoryRouter>
      <RealApp />
    </MemoryRouter>
  );
});
