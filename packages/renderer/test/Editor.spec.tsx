import React, { useMemo } from 'react';
import { waitFor } from '@testing-library/react';
import { configure, fireEvent, screen } from '@testing-library/dom';
import { fake, replace, restore, SinonSpy, spy, stub } from 'sinon';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import { Editor } from '@lyricistant/renderer/editor/Editor';
import { PlatformFile } from '@lyricistant/common/files/Files';
import { EditorView } from '@codemirror/view';
import { Text } from '@codemirror/state';
import {
  CodeMirrorEditorProps,
  WordReplacement,
} from '@lyricistant/codemirror/CodeMirror';
import { render as render } from './Wrappers';
import { MockLogger } from './MockLogger';
import { MockPlatformDelegate } from './MockPlatformDelegate';

use(sinonChai);

const droppedFile: PlatformFile = {
  metadata: { path: 'filename.txt' },
  type: 'text/plain',
  data: new TextEncoder().encode('Oh wow!').buffer,
};

describe('Editor component', function () {
  let platformDelegate: MockPlatformDelegate;
  let setState: SinonSpy;
  let dispatch: SinonSpy;

  beforeEach(async () => {
    configure({
      getElementError: (message) => {
        const error = new Error(message);
        error.name = 'TestingLibraryElementError';
        return error;
      },
    });
    const CodeMirrorEditor =
      require('@lyricistant/codemirror/CodeMirror').CodeMirrorEditor;
    replace(
      require('@lyricistant/codemirror/CodeMirror'),
      'CodeMirrorEditor',
      (props: CodeMirrorEditorProps) => {
        const onEditorMounted = props.onEditorMounted;
        const newProps = useMemo(
          () => ({
            ...props,
            onEditorMounted: (view: EditorView) => {
              setState = spy(view, 'setState');
              dispatch = spy(view, 'dispatch');
              onEditorMounted(view);
            },
          }),
          [props.onEditorMounted]
        );
        return CodeMirrorEditor(newProps);
      }
    );
    fake(require('@lyricistant/codemirror/CodeMirror').CodeMirrorEditor);
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

    fireEvent.drop(element, {
      dataTransfer: {
        files: [
          new File(['Oh wow!'], 'filename.txt', {
            type: 'text/plain',
          }),
        ],
      },
    });
    window.DragEvent = oldDragEvent;

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWithMatch(
        'open-file-attempt',
        droppedFile
      )
    );
  });

  it('handles files being saved', async () => {
    render(<Editor />);

    await waitFor(() =>
      platformDelegate.invoke('file-save-ended', undefined, 'apath.txt')
    );

    await waitFor(() => {
      expect(screen.getByText('apath.txt saved')).to.exist;
      expect(setState).to.have.been.called;
    });
  });

  it("handles the platform checking if file is modified when it isn't", async () => {
    stub(require('@codemirror/history'), 'undoDepth').returns(0);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('check-file-modified'));

    await waitFor(() => {
      expect(platformDelegate.send).to.have.been.calledWith(
        'is-file-modified',
        false
      );
    });
  });

  it('handles the platform checking if file is modified when user has made edits', async () => {
    stub(require('@codemirror/history'), 'undoDepth').returns(1);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('check-file-modified'));

    await waitFor(() => {
      expect(platformDelegate.send).to.have.been.calledWith(
        'is-file-modified',
        true
      );
    });
  });

  it('handles the platform having created a new file', async () => {
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('new-file-created'));

    await waitFor(() => expect(setState).to.have.been.called);
  });

  it('handles the platform having opened a file', async () => {
    render(<Editor />);

    await waitFor(() =>
      platformDelegate.invoke('file-opened', null, 'afile.txt', 'Oh wow!', true)
    );

    expect(setState).to.have.been.calledWithMatch({
      doc: Text.of(['Oh wow!']),
    });
  });

  it('handles the platform having opened a file but does not clear history', async () => {
    render(<Editor />);
    dispatch({ changes: { from: 0, to: 0, insert: 'Hello' } });

    await waitFor(() =>
      platformDelegate.invoke(
        'file-opened',
        null,
        'afile.txt',
        'Oh wow!',
        false
      )
    );

    expect(dispatch).to.have.been.calledWithMatch({
      changes: {
        from: 0,
        to: 5,
        insert: 'Oh wow!',
      },
    });
  });

  it('handles the platform asking for the editor text', async () => {
    render(<Editor />);
    dispatch({ changes: { from: 0, to: 0, insert: 'Hello' } });

    await waitFor(() => platformDelegate.invoke('request-editor-text'));

    await waitFor(() =>
      expect(platformDelegate.send).to.have.been.calledWith(
        'editor-text',
        'Hello'
      )
    );
  });

  it('handles the platform trying to undo', async () => {
    const undo = spy(require('@codemirror/history'), 'undo');

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('undo'));

    await waitFor(() => expect(undo).to.have.been.called);
  });

  it('handles the platform trying to redo', async () => {
    const redo = spy(require('@codemirror/history'), 'redo');

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('redo'));

    await waitFor(() => expect(redo).to.have.been.called);
  });

  it('handles the platform trying to perform a search', async () => {
    const openSearchPanel = spy(
      require('@codemirror/search'),
      'openSearchPanel'
    );

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('find'));

    await waitFor(() => expect(openSearchPanel).to.have.been.called);
  });

  it('handles the platform trying to perform a replace', async () => {
    const openSearchPanel = spy(
      require('@codemirror/search'),
      'openSearchPanel'
    );

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('replace'));

    await waitFor(() => expect(openSearchPanel).to.have.been.called);
  });

  it('passes the selected word store into codemirror', async () => {
    const CodeMirrorEditor = spy(
      require('@lyricistant/codemirror/CodeMirror'),
      'CodeMirrorEditor'
    );
    const onWordSelected = stub();
    stub(
      require('@lyricistant/renderer/editor/SelectedWordStore'),
      'useSelectedWordStore'
    ).returns({
      onWordSelected,
    });
    stub(
      require('@lyricistant/renderer/editor/SelectedWordStore'),
      'useSelectedWords'
    );
    stub(
      require('@lyricistant/renderer/editor/SelectedWordStore'),
      'useReplacedWords'
    );

    render(<Editor />);

    await waitFor(() => {
      expect(CodeMirrorEditor).to.have.been.calledWithMatch({
        onWordSelected,
      });
    });
  });

  it('passes the replaced word into codemirror', async () => {
    const CodeMirrorEditor = spy(
      require('@lyricistant/codemirror/CodeMirror'),
      'CodeMirrorEditor'
    );
    const wordReplacement: WordReplacement = {
      originalWord: {
        from: 0,
        to: 5,
        word: 'hello',
      },
      newWord: 'world',
    };
    stub(
      require('@lyricistant/renderer/editor/SelectedWordStore'),
      'useReplacedWords'
    ).returns(wordReplacement);

    render(<Editor />);

    await waitFor(() =>
      expect(CodeMirrorEditor).to.have.been.calledWithMatch({
        wordReplacement,
      })
    );
  });
});
