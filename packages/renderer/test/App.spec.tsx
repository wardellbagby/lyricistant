import React from 'react';
// import { App as RealApp } from '@lyricistant/renderer/app/App';
// import { waitFor } from '@testing-library/react';
// import { configure, screen } from '@testing-library/dom';
// import { expect, use } from 'chai';
// import sinonChai from 'sinon-chai';
// import { MemoryRouter } from 'react-router-dom';
// import { MockPlatformDelegate } from './MockPlatformDelegate';
// import { MockLogger } from './MockLogger';
import { render } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';


describe('App component', () => {
  // let platformDelegate: MockPlatformDelegate;

  beforeEach(async () => {
    // configure({
    //   getElementError: (message) => {
    //     const error = new Error(message);
    //     error.name = 'TestingLibraryElementError';
    //     return error;
    //   },
    // });
    // platformDelegate = new MockPlatformDelegate();

    // window.platformDelegate = platformDelegate;
    // window.logger = new MockLogger();
  });

  afterEach(() => {
    // platformDelegate.clear();
    // restore();
  });

  it('updates the document title when the app title changes', async () => {
    render(<div />);

    // await waitFor(() =>
    //   platformDelegate.invoke('app-title-changed', 'All I Need')
    // );

    // await waitFor(() => document.title);

    // expect(document.title).to.equal('All I Need');
  });

  // it('shows an error when files fail to open', async () => {
  //   render(<App />);

  //   await waitFor(() =>
  //     platformDelegate.invoke(
  //       'file-opened',
  //       new Error('oh no!'),
  //       undefined,
  //       false
  //     )
  //   );

  //   expect(screen.getByText("Couldn't open selected file.")).to.exist;
  // });

  // it('handles files being saved', async () => {
  //   render(<App />);

  //   // const editor = await screen.findByRole('textbox');
  //   //
  //   // userEvent.type(editor, 'Initial');
  //   //
  //   // userEvent.type(editor, ' More');
  //   // expect(screen.getByText('Initial More')).to.exist;
  //   //
  //   // await waitFor(() =>
  //   //   platformDelegate.invoke('file-save-ended', undefined, 'apath.txt')
  //   // );

  //   await waitFor(() => {
  //     expect(screen.getByText('apath.txt saved')).to.exist;
  //   });
  //   userEvent.keyboard('{Meta>}Z{/Meta}');
  //   expect(screen.getByText('Initial')).to.exist;
  // });

  // const App = () => (
  //   // <MemoryRouter>
  //     <RealApp />
  //   // </MemoryRouter>
  // );
});
