import React from 'react';
import notistack from 'notistack';
import '@testing-library/jest-dom/extend-expect';
import { App } from '@renderer/components/App';
import { render, waitFor } from '@testing-library/react';
import { MockPlatformDelegate } from './MockPlatformDelegate';

let platformDelegate: MockPlatformDelegate;

jest.mock('@renderer/globals', () => ({
  logger: {
    debug: (): void => undefined,
    verbose: (): void => undefined,
    info: (): void => undefined,
    warn: (): void => undefined,
    error: (): void => undefined,
  },
  platformDelegate: new (require('./MockPlatformDelegate').MockPlatformDelegate)(),
}));
jest.mock('notistack', () => ({
  useSnackbar: jest.fn(),
}));
const enqueueSnackbar = jest.fn();
jest
  .spyOn(notistack, 'useSnackbar')
  .mockImplementation(() => ({ enqueueSnackbar, closeSnackbar: jest.fn() }));

describe('App component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformDelegate = jest.requireMock('@renderer/globals').platformDelegate;
    platformDelegate.clear();
  });

  it('updates the document title when the app title changes', async () => {
    render(<App />);

    await waitFor(() =>
      platformDelegate.invoke('app-title-changed', 'All I Need')
    );

    await waitFor(() => document.title);

    expect(document.title).toEqual('All I Need');
  });

  it('shows an error when files fail to open', async () => {
    render(<App />);

    await waitFor(() =>
      platformDelegate.invoke(
        'file-opened',
        new Error('oh no!'),
        'bad-file.bin',
        undefined,
        false
      )
    );

    await waitFor(() => enqueueSnackbar.mock.calls.length > 0);

    expect(enqueueSnackbar).toBeCalledWith("Couldn't open bad-file.bin", {
      variant: 'error',
    });
  });
});
