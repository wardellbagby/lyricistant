import React, { DependencyList, useEffect } from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, waitFor } from '@testing-library/react';
import { Editor } from '@renderer/components/Editor';
import type { EditorView } from '@codemirror/view';
import { MockPlatformDelegate } from './MockPlatformDelegate';

let platformDelegate: MockPlatformDelegate;

type NestedPartial<T> = {
  [P in keyof T]?: NestedPartial<T[P]>;
};

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
jest.mock('@renderer/hooks/useEventListener');
jest.mock('react-beforeunload');
jest.mock('@codemirror/history', () => ({
  undoDepth: jest.fn(),
  redo: jest.fn(),
  undo: jest.fn(),
}));
jest.mock('@codemirror/search', () => ({
  openSearchPanel: jest.fn(),
}));
jest.mock('notistack', () => ({
  useSnackbar: jest.fn(),
}));
jest.mock('@lyricistant-codemirror/CodeMirror', () => ({
  CodeMirrorEditor: jest.fn(),
}));
jest.mock('@renderer/util/to-droppable-file');
jest.mock('@renderer/stores/SelectedWordStore', () => ({
  useSelectedWordStore: jest.fn(),
  useReplacedWords: jest.fn(),
}));

const droppedFile = {
  path: 'filename.txt',
  type: 'text/plain',
  data: 'Oh wow!',
};
let editor: NestedPartial<EditorView>;
const enqueueSnackbar = jest.fn();
const createEditorState = jest.fn();
const onWordSelected = jest.fn();

describe('Editor component', () => {
  beforeEach(() => {
    platformDelegate = jest.requireMock('@renderer/globals').platformDelegate;
    jest.useFakeTimers('modern');
    platformDelegate.clear();
    require('@lyricistant-codemirror/CodeMirror').CodeMirrorEditor.mockImplementation(
      ({ onEditorMounted, onDefaultConfigReady }: any): null => {
        useEffect(() => {
          editor = {
            state: { doc: 'Hello' },
            setState: jest.fn(),
            dispatch: jest.fn(),
          };
          onEditorMounted(editor);
        }, [onEditorMounted]);
        useEffect(() => {
          onDefaultConfigReady({});
        }, [onDefaultConfigReady]);
        return null;
      }
    );
    require('@renderer/util/to-droppable-file').toDroppableFile.mockImplementation(
      () => droppedFile
    );
    require('notistack').useSnackbar.mockImplementation(() => ({
      enqueueSnackbar,
    }));
    require('@codemirror/state').EditorState.create = createEditorState;
    require('@renderer/stores/SelectedWordStore').useSelectedWordStore.mockImplementation(
      () => ({
        onWordSelected,
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('tells the platform when user drops a file', async () => {
    const useDocumentListener: jest.Mock<
      void,
      [string, (event: NestedPartial<DragEvent>) => void, DependencyList]
    > = require('@renderer/hooks/useEventListener').useDocumentListener;
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;

    useDocumentListener.mockImplementation((eventName, listener) => {
      useEffect(() => {
        if (eventName !== 'drop') {
          return;
        }
        listener({
          preventDefault: (): void => undefined,
          stopPropagation: (): void => undefined,
          dataTransfer: {
            files: {
              length: 1,
              item: (): null => null,
            },
          },
        });
      }, [eventName, listener]);
    });
    undoDepth.mockImplementation(() => 0);

    render(<Editor />);

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith(
        'open-file-attempt',
        droppedFile
      );
    });
  });

  it('tells the platform when user drops a file when editor has history', async () => {
    const useDocumentListener: jest.Mock<
      void,
      [string, (event: NestedPartial<DragEvent>) => void, DependencyList]
    > = require('@renderer/hooks/useEventListener').useDocumentListener;
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;

    useDocumentListener.mockImplementation((eventName, listener) => {
      useEffect(() => {
        if (eventName !== 'drop') {
          return;
        }
        listener({
          preventDefault: (): void => undefined,
          stopPropagation: (): void => undefined,
          dataTransfer: {
            files: {
              length: 1,
              item: (): null => null,
            },
          },
        });
      }, [eventName, listener]);
    });
    undoDepth.mockImplementation(() => 1);

    render(<Editor />);

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith(
        'prompt-save-file-for-open',
        droppedFile
      );
    });
  });

  it('supports dragover events', async () => {
    const useDocumentListener: jest.Mock<
      void,
      [string, (event: NestedPartial<DragEvent>) => boolean, DependencyList]
    > = require('@renderer/hooks/useEventListener').useDocumentListener;
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;

    let result: boolean = null;
    useDocumentListener.mockImplementation((eventName, listener) => {
      useEffect(() => {
        if (eventName !== 'dragover') {
          return;
        }
        result = listener({
          preventDefault: (): void => undefined,
        });
      }, [eventName, listener]);
    });
    undoDepth.mockImplementation(() => 0);

    render(<Editor />);

    await waitFor(() => {
      expect(result).toEqual(true);
    });
  });

  it('handles files being saved', async () => {
    render(<Editor />);

    await waitFor(() =>
      platformDelegate.invoke('file-save-ended', new Error(''), 'apath.txt')
    );

    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalledWith('apath.txt saved', {
        variant: 'success',
      });
      expect(editor.setState).toHaveBeenCalled();
    });
  });

  it('handles the platform trying to create a new file', async () => {
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;
    undoDepth.mockReturnValue(0);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('is-okay-for-new-file'));

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith('okay-for-new-file');
    });
  });

  it('handles the platform trying to create a new file when user has made edits', async () => {
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;
    undoDepth.mockReturnValue(1);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('is-okay-for-new-file'));

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith(
        'prompt-save-file-for-new'
      );
    });
  });

  it('handles the platform trying to quit', async () => {
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;
    undoDepth.mockReturnValue(0);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('is-okay-for-quit-file'));

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith('okay-for-quit');
    });
  });

  it('handles the platform trying to quit when user has made edits', async () => {
    const undoDepth: jest.Mock<number, []> = require('@codemirror/history')
      .undoDepth;
    undoDepth.mockReturnValue(1);

    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('is-okay-for-quit-file'));

    await waitFor(() => {
      expect(platformDelegate.send).toHaveBeenCalledWith(
        'prompt-save-file-for-quit'
      );
    });
  });

  it('handles the platform having created a new file', async () => {
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('new-file-created'));

    await waitFor(() => expect(editor.setState).toHaveBeenCalled());
  });

  it('handles the platform having opened a file', async () => {
    createEditorState.mockImplementation((config: any) => ({
      doc: config.doc,
    }));

    render(<Editor />);

    await waitFor(() =>
      platformDelegate.invoke('file-opened', null, 'afile.txt', 'Oh wow!', true)
    );

    await waitFor(() =>
      expect(editor.setState).toHaveBeenCalledWith({
        doc: 'Oh wow!',
      })
    );
  });

  it('handles the platform having opened a file but does not clear history', async () => {
    createEditorState.mockImplementation((config: any) => ({
      doc: config.doc,
    }));

    render(<Editor />);

    await waitFor(() =>
      platformDelegate.invoke(
        'file-opened',
        null,
        'afile.txt',
        'Oh wow!',
        false
      )
    );

    await waitFor(() =>
      expect(editor.dispatch).toHaveBeenCalledWith({
        changes: {
          from: 0,
          to: 5,
          insert: 'Oh wow!',
        },
      })
    );
  });

  it('handles the platform asking for the editor text', async () => {
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('request-editor-text'));

    await waitFor(() =>
      expect(platformDelegate.send).toHaveBeenCalledWith('editor-text', 'Hello')
    );
  });

  it('handles the platform trying to undo', async () => {
    const undo = require('@codemirror/history').undo;
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('undo'));

    await waitFor(() => expect(undo).toHaveBeenCalled());
  });

  it('handles the platform trying to redo', async () => {
    const redo = require('@codemirror/history').redo;
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('redo'));

    await waitFor(() => expect(redo).toHaveBeenCalled());
  });

  it('handles the platform trying to perform a search', async () => {
    const openSearchPanel = require('@codemirror/search').openSearchPanel;
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('find'));

    await waitFor(() => expect(openSearchPanel).toHaveBeenCalled());
  });

  it('handles the platform trying to perform a replace', async () => {
    const openSearchPanel = require('@codemirror/search').openSearchPanel;
    render(<Editor />);

    await waitFor(() => platformDelegate.invoke('replace'));

    await waitFor(() => expect(openSearchPanel).toHaveBeenCalled());
  });

  it('prompts the user before the window is unloaded', async () => {
    let result: string = null;
    require('react-beforeunload').useBeforeunload.mockImplementation(
      (listener: () => string) => {
        useEffect(() => {
          result = listener();
        }, [listener]);
      }
    );
    require('@codemirror/history').undoDepth.mockReturnValue(1);
    render(<Editor />);

    await waitFor(() => expect(result).toBeTruthy());
  });

  it('does not prompt the user before the window is unloaded when there are no changes', async () => {
    let result: string = null;
    require('react-beforeunload').useBeforeunload.mockImplementation(
      (listener: () => string) => {
        useEffect(() => {
          result = listener();
        }, [listener]);
      }
    );
    require('@codemirror/history').undoDepth.mockReturnValue(0);
    render(<Editor />);

    await waitFor(() => expect(result).toBeUndefined());
  });

  it('passes the selected word store into codemirror', async () => {
    const CodeMirrorEditor = require('@lyricistant-codemirror/CodeMirror')
      .CodeMirrorEditor;

    render(<Editor />);

    await waitFor(() =>
      expect(CodeMirrorEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          onWordSelected,
        }),
        {}
      )
    );
  });

  it('passes the replaced word into codemirror', async () => {
    const CodeMirrorEditor = require('@lyricistant-codemirror/CodeMirror')
      .CodeMirrorEditor;
    const wordReplacement = 'hello';
    require('@renderer/stores/SelectedWordStore').useReplacedWords.mockReturnValue(
      wordReplacement
    );

    render(<Editor />);

    await waitFor(() =>
      expect(CodeMirrorEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          wordReplacement,
        }),
        {}
      )
    );
  });
});
