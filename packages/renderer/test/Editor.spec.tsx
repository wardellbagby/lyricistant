import { expect, jest } from '@jest/globals';
import { Text } from '@lyricistant/codemirror/CodeMirror';
import {
  Editor as RealEditor,
  EditorProps,
} from '@lyricistant/renderer/editor/Editor';
import { toPlatformFile } from '@lyricistant/renderer/editor/to-platform-file';
import { configure, fireEvent, screen } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';
import { render as render, wait } from './Wrappers';

const Editor = (props: Partial<EditorProps>) => (
  <RealEditor
    onTextSelected={() => undefined}
    onModificationStateChanged={() => undefined}
    onSelectedDiagnosticRendered={() => undefined}
    diagnostics={[]}
    onTextChanged={() => undefined}
    value={{ isTransactional: false, text: Text.empty }}
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
    jest.resetAllMocks();
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

    await waitFor(() => {
      fireEvent.drop(element, {
        dataTransfer: {
          files: [file],
        },
      });
      window.DragEvent = oldDragEvent;
    });

    expect(await file.arrayBuffer()).toEqual(platformFile.data);
    expect(platformDelegate.send).toHaveBeenCalledWith(
      'open-file-attempt',
      platformFile,
    );
  });

  it('handles the platform trying to undo', async () => {
    render(<Editor />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'you got bamboozled');
    await expect(screen.getByText('you got bamboozled')).toBeTruthy();

    await wait(1000);

    await userEvent.clear(editor);
    await userEvent.type(editor, 'mozambique here');
    await expect(screen.getByText('mozambique here')).toBeTruthy();

    await wait(1000);

    // userEvent doesn't let you specify where you typed at, so we clear the
    // editor then type a new phrase. This means the first undo takes us back to
    // clear, and the second gives us back the original phrase.
    await platformDelegate.invoke('undo');
    await platformDelegate.invoke('undo');

    await expect(screen.getByText('you got bamboozled')).toBeTruthy();
  });

  it('handles the platform trying to redo', async () => {
    render(<Editor />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'you got bamboozled');
    await expect(screen.getByText('you got bamboozled')).toBeTruthy();

    await wait(1000);

    await userEvent.clear(editor);
    await userEvent.type(editor, 'mozambique here');
    await expect(screen.getByText('mozambique here')).toBeTruthy();

    await wait(1000);

    // userEvent doesn't let you specify where you typed at, so we clear the
    // editor then type a new phrase. This means the first undo takes us back to
    // clear, and the second gives us back the original phrase.
    await platformDelegate.invoke('undo');
    await platformDelegate.invoke('undo');

    await expect(screen.getByText('you got bamboozled')).toBeTruthy();

    await platformDelegate.invoke('redo');
    await platformDelegate.invoke('redo');

    expect(screen.getByText('mozambique here')).toBeTruthy();
  });

  it('handles the platform trying to perform a search', async () => {
    render(<Editor />);

    expect(screen.queryByPlaceholderText('Find')).toBeNull();
    expect(screen.queryByPlaceholderText('Replace')).toBeNull();

    await platformDelegate.invoke('find');

    expect(screen.getByPlaceholderText('Find')).toBeTruthy();
    expect(screen.getByPlaceholderText('Replace')).toBeTruthy();
  });

  it('handles the platform trying to perform a replace', async () => {
    render(<Editor />);

    expect(screen.queryByPlaceholderText('Find')).toBeNull();
    expect(screen.queryByPlaceholderText('Replace')).toBeNull();

    await platformDelegate.invoke('replace');

    expect(screen.getByPlaceholderText('Find')).toBeTruthy();
    expect(screen.getByPlaceholderText('Replace')).toBeTruthy();
  });

  it('updates the selected word', async () => {
    const onWordSelected = jest.fn();

    render(<Editor onTextSelected={onWordSelected} />);

    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'ziplock');

    expect(screen.getByText('ziplock')).toBeTruthy();
    expect(onWordSelected).toHaveBeenCalledWith({
      from: 0,
      to: 7,
      text: 'ziplock',
    });
  });

  it('shows the text from props', async () => {
    render(
      <Editor
        value={{
          text: Text.of(["I'm willing to bet it all"]),
          isTransactional: false,
        }}
      />,
    );

    expect(screen.getByText("I'm willing to bet it all")).toBeTruthy();
  });
});
