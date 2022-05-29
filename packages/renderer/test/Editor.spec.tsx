import {
  Editor as RealEditor,
  EditorProps,
} from '@lyricistant/renderer/editor/Editor';
import { toPlatformFile } from '@lyricistant/renderer/editor/to-platform-file';
import { configure, fireEvent, screen } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, use } from 'chai';
import React from 'react';
import { restore, stub } from 'sinon';
import sinonChai from 'sinon-chai';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { render as render, wait } from './Wrappers';

use(sinonChai);

const Editor = (props: Partial<EditorProps>) => (
  <RealEditor
    onTextSelected={() => undefined}
    onModificationStateChanged={() => undefined}
    onTextChanged={() => undefined}
    value={{ isTransactional: false, text: '' }}
    {...props}
  />
);

describe('Editor component', function () {
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

  it('tells the platform when user drops a file', async () => {
    render(<Editor />);

    const element = await screen.findByRole('textbox');

    const oldDragEvent = window.DragEvent;
    window.DragEvent = undefined;

    const file = new File(['Oh wow!'], 'filename.txt', {
      type: 'text/plain',
    });
    const platformFile = await toPlatformFile(file);

    fireEvent.drop(element, {
      dataTransfer: {
        files: [file],
      },
    });
    window.DragEvent = oldDragEvent;

    expect(await file.arrayBuffer()).to.eql(platformFile.data);
    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWithMatch(
        'open-file-attempt',
        platformFile
      )
    );
  });

  it('handles the platform trying to undo', async () => {
    render(<Editor />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'you got bamboozled');
    await expect(screen.getByText('you got bamboozled')).to.exist;

    await wait(1000);

    await userEvent.clear(editor);
    await userEvent.type(editor, 'mozambique here');
    await expect(screen.getByText('mozambique here')).to.exist;

    await wait(1000);

    // userEvent doesn't let you specify where you typed at, so we clear the
    // editor then type a new phrase. This means the first undo takes us back to
    // clear, and the second gives us back the original phrase.
    await platformDelegate.invoke('undo');
    await platformDelegate.invoke('undo');

    await expect(screen.getByText('you got bamboozled')).to.exist;
  });

  it('handles the platform trying to redo', async () => {
    render(<Editor />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'you got bamboozled');
    await expect(screen.getByText('you got bamboozled')).to.exist;

    await wait(1000);

    await userEvent.clear(editor);
    await userEvent.type(editor, 'mozambique here');
    await expect(screen.getByText('mozambique here')).to.exist;

    await wait(1000);

    // userEvent doesn't let you specify where you typed at, so we clear the
    // editor then type a new phrase. This means the first undo takes us back to
    // clear, and the second gives us back the original phrase.
    await platformDelegate.invoke('undo');
    await platformDelegate.invoke('undo');

    await expect(screen.getByText('you got bamboozled')).to.exist;

    await platformDelegate.invoke('redo');
    await platformDelegate.invoke('redo');

    expect(screen.getByText('mozambique here')).to.exist;
  });

  it('handles the platform trying to perform a search', async () => {
    render(<Editor />);

    expect(screen.queryByPlaceholderText('Find')).to.not.exist;
    expect(screen.queryByPlaceholderText('Replace')).to.not.exist;

    await platformDelegate.invoke('find');

    expect(screen.getByPlaceholderText('Find')).to.exist;
    expect(screen.getByPlaceholderText('Replace')).to.exist;
  });

  it('handles the platform trying to perform a replace', async () => {
    render(<Editor />);

    expect(screen.queryByPlaceholderText('Find')).to.not.exist;
    expect(screen.queryByPlaceholderText('Replace')).to.not.exist;

    await platformDelegate.invoke('replace');

    expect(screen.getByPlaceholderText('Find')).to.exist;
    expect(screen.getByPlaceholderText('Replace')).to.exist;
  });

  it('updates the selected word', async () => {
    const onWordSelected = stub();

    render(<Editor onTextSelected={onWordSelected} />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'ziplock');

    expect(screen.getByText('ziplock')).to.exist;
    expect(onWordSelected).to.have.been.calledWith({
      from: 0,
      to: 7,
      text: 'ziplock',
    });
  });

  it('shows the text from props', async () => {
    render(
      <Editor
        value={{
          text: "I'm willing to bet it all",
          isTransactional: false,
        }}
      />
    );

    expect(screen.getByText("I'm willing to bet it all")).to.exist;
  });
});
