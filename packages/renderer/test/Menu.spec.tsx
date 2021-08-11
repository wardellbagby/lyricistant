import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { History } from 'history';
import { render, waitFor } from '@testing-library/react';
import { MockPlatformDelegate } from './MockPlatformDelegate';

let platformDelegate: MockPlatformDelegate;

jest.mock('@lyricistant/renderer/globals', () => ({
  logger: {
    debug: (): void => undefined,
    verbose: (): void => undefined,
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined,
  },
  platformDelegate:
    new (require('./MockPlatformDelegate').MockPlatformDelegate)(),
}));

let mockUseEditorText: jest.Mock<string>;
let mockUseHistory: jest.Mock<Partial<History<unknown>>>;
let mockDownloadApp: jest.Mock<boolean>;
jest.mock('@lyricistant/renderer/editor/EditorTextStore', () => ({
  useEditorText: jest.fn(),
}));
jest.mock('react-router-dom', () => ({ useHistory: jest.fn() }));
jest.mock('@lyricistant/renderer/download', () => ({
  downloadApp: jest.fn(),
}));

describe('Menu component', () => {
  beforeEach(() => {
    platformDelegate = jest.requireMock(
      '@lyricistant/renderer/globals'
    ).platformDelegate;
    mockUseEditorText = jest.requireMock(
      '@lyricistant/renderer/editor/EditorTextStore'
    ).useEditorText;
    mockUseHistory = jest.requireMock('react-router-dom').useHistory;
    mockDownloadApp = jest.requireMock(
      '@lyricistant/renderer/download/'
    ).downloadApp;

    jest.clearAllMocks();
    jest.useFakeTimers('modern');
    platformDelegate.clear();
  });

  it('tells the platform when user attempts to make a new file', async () => {
    render(<Menu />);

    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'New' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(platformDelegate.send).toHaveBeenCalledWith('new-file-attempt');
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
      screen.getByRole('button', { name: 'Open' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(platformDelegate.send).toHaveBeenCalledWith('open-file-attempt');
  });

  it('tells the platform when user attempts to save a file', async () => {
    mockUseEditorText.mockReturnValue('Text!');
    render(<Menu />);
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Save' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(platformDelegate.send).toHaveBeenCalledWith(
      'save-file-attempt',
      'Text!'
    );
  });

  it('goes to preferences when clicked', async () => {
    const history = {
      replace: jest.fn(),
    };
    mockUseHistory.mockReturnValue(history);

    render(<Menu />);
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Open Preferences' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(history.replace).toHaveBeenCalledWith('/preferences');
  });

  it("goes to download app when clicked and we could't auto-download", async () => {
    mockDownloadApp.mockReturnValue(false);
    const history = {
      replace: jest.fn(),
    };
    mockUseHistory.mockReturnValue(history);

    render(<Menu />);

    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: false,
        showDownload: true,
        showBrowserWarning: false,
      })
    );
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Download App' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(history.replace).toHaveBeenCalledWith('/download');
  });

  it('does not go to download app when clicked and we could auto-download', async () => {
    mockDownloadApp.mockReturnValue(true);
    const history = {
      replace: jest.fn(),
    };
    mockUseHistory.mockReturnValue(history);

    render(<Menu />);

    await waitFor(() =>
      platformDelegate.invoke('ui-config', {
        showOpen: false,
        showDownload: true,
        showBrowserWarning: false,
      })
    );
    const element = await waitFor(() =>
      screen.getByRole('button', { name: 'Download App' })
    );
    userEvent.click(element);

    jest.runAllTimers();
    expect(history.replace).toBeCalledTimes(0);
  });
});
