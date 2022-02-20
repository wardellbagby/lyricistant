import React from 'react';
import { App as RealApp } from '@lyricistant/renderer/app/App';
import { waitFor } from '@testing-library/react';
import { restore } from 'sinon';
import { configure, screen } from '@testing-library/dom';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import { MemoryRouter } from 'react-router-dom';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { MockLogger } from './MockLogger';
import { render } from './Wrappers';

use(sinonChai);

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
    restore();
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

  const App = () => (
    <MemoryRouter>
      <RealApp />
    </MemoryRouter>
  );
});
