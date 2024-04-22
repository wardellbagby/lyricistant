import { expect } from '@jest/globals';
import {
  ColorScheme,
  DefaultFileType,
  DetailPaneVisibility,
  Font,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { App as RealApp } from '@lyricistant/renderer/app/App';
import { configure, screen } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { BaseLocationHook, Router } from 'wouter';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { nestedElementTextMatcher, render, wait } from './Wrappers';

jest.mock('@lyricistant/rhyme-generator');

describe('App component', () => {
  let platformDelegate: MockPlatformDelegate;

  beforeEach(async () => {
    configure({
      asyncUtilTimeout: process.env.CI ? 3_000 : 1_000,
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
    await act(() => render(<App />));

    await platformDelegate.invoke('app-title-changed', 'All I Need');

    expect(document.title).toBe('All I Need');
  });

  it('shows an error when files fail to open', async () => {
    await act(() => render(<App />));

    await platformDelegate.invoke(
      'file-opened',
      new Error('oh no!'),
      undefined,
      false
    );

    expect(screen.getByText("Couldn't open selected file.")).toBeTruthy();
  });

  it('handles files being saved', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'Initially here');

    await expect(
      screen.getByText(nestedElementTextMatcher('Initially here'))
    ).toBeTruthy();

    await platformDelegate.invoke('file-save-ended', undefined, 'apath.txt');

    await expect(screen.getByText('apath.txt saved')).toBeTruthy();

    await platformDelegate.invoke('undo');
    expect(
      screen.getByText(nestedElementTextMatcher('Initially here'))
    ).toBeTruthy();
  });

  it("handles the platform checking if file is modified when it isn't", async () => {
    await act(() => render(<App />));

    await platformDelegate.invoke('check-file-modified');

    expect(platformDelegate.send).toHaveBeenCalledWith(
      'is-file-modified',
      false
    );
  });

  it('handles the platform checking if file is modified when user has made edits', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'oh no the printer jaaaaaaaaaaaaaammmmed');

    await platformDelegate.invoke('check-file-modified');

    expect(platformDelegate.send).toHaveBeenCalledWith(
      'is-file-modified',
      true
    );
  });

  it('handles the platform having created a new file', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'my loco pinocchio');

    await expect(
      await screen.findByText(nestedElementTextMatcher('my loco pinocchio'))
    ).toBeTruthy();

    await platformDelegate.invoke('new-file-created');

    await platformDelegate.invoke('undo');
    await expect(screen.queryByText('my loco pinocchio')).toBeNull();
  });

  it('handles the platform having opened a file', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'ok! coo!');

    await expect(
      screen.getByText(nestedElementTextMatcher('ok! coo!'))
    ).toBeTruthy();

    await platformDelegate.invoke('file-opened', null, 'coo coo...', true);

    await expect(
      await screen.findByText(nestedElementTextMatcher('coo coo...'))
    ).toBeTruthy();

    await platformDelegate.invoke('undo');
    await expect(
      await screen.findByText(nestedElementTextMatcher('coo coo...'))
    ).toBeTruthy();
  });

  it('handles the platform having opened a file but does not clear history', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'dot buzz backslash tight!');
    await expect(
      screen.getByText(nestedElementTextMatcher('dot buzz backslash tight!'))
    ).toBeTruthy();
    // We need to wait here for CodeMirror to update its undo cache.
    await wait(1000);

    await platformDelegate.invoke('file-opened', null, 'de-ope!', false);

    await expect(await screen.findByText('de-ope!')).toBeTruthy();
    await wait(1000);

    await platformDelegate.invoke('undo');
    await expect(
      await screen.findByText('dot buzz backslash tight!')
    ).toBeTruthy();
  });

  it('handles the platform asking for the editor text', async () => {
    await act(() => render(<App />));

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'and the oscar goes to...');

    await platformDelegate.invoke('request-editor-text');

    expect(platformDelegate.send).toHaveBeenCalledWith(
      'editor-text',
      'and the oscar goes to...'
    );
  });

  it('replaces words when rhymes are clicked', async () => {
    await act(() => render(<App />));

    await platformDelegate.invoke('prefs-updated', {
      rhymeSource: RhymeSource.Offline,
      font: Font.Roboto,
      colorScheme: ColorScheme.Dark,
      textSize: 16,
      defaultFileType: DefaultFileType.Always_Ask,
      detailPaneVisibility: DetailPaneVisibility.Always_Show,
    });

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'and the oscar goes to you...');

    expect(await screen.findByText('Test Rhyme 1')).toBeTruthy();
    expect(await screen.findByText('Test Rhyme 2')).toBeTruthy();

    await userEvent.click(screen.getByText('Test Rhyme 1'));

    expect(
      await screen.findByText(
        nestedElementTextMatcher('and the oscar goes to Test Rhyme 1...')
      )
    ).toBeTruthy();

    await userEvent.click(screen.getByText('Test Rhyme 2'));

    expect(
      await screen.findByText(
        nestedElementTextMatcher(
          'and the oscar goes to Test Rhyme Test Rhyme 2...'
        )
      )
    ).toBeTruthy();
  });

  const useMemoryLocation: BaseLocationHook = () => {
    const [path, setPath] = useState('');
    return [path, setPath];
  };

  const App = () => (
    <Router hook={useMemoryLocation}>
      <RealApp />
    </Router>
  );
});
