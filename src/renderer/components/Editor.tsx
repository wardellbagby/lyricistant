import { IpcChannels } from 'common/ipc-channels';
import { LYRICISTANT_LANGUAGE } from 'common/monaco-helpers';
import { ipcRenderer } from 'electron';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { FunctionComponent, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { toast } from 'react-toastify';
import { fromEventPattern, merge, Observable, Subject } from 'rxjs';
import { NodeEventHandler } from 'rxjs/internal/observable/fromEvent';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import syllable from 'syllable';

export interface TextReplacement {
  word: string;
  range: monaco.IRange;
}
export interface WordAtPosition {
  range: monaco.IRange;
  word: string;
}
export interface EditorProps {
  className?: string;
  fontSize: number;
  onWordSelected: (word: WordAtPosition) => void;
  textReplacements: Observable<TextReplacement>;
}

const cursorUpdateKicker: Subject<undefined> = new Subject();

export const Editor: FunctionComponent<EditorProps> = (props: EditorProps) => {
  const [editor, setEditor] = useState(
    null as monaco.editor.IStandaloneCodeEditor
  );
  const [version, setVersion] = useState(0);
  const editorDidMount = (
    editorInstance: monaco.editor.IStandaloneCodeEditor
  ): void => {
    setEditor(editorInstance);
    setVersion(editorInstance.getModel().getAlternativeVersionId());
  };

  useEffect(handleSelectedWordChanges(editor, props.onWordSelected), [
    editor,
    props.onWordSelected
  ]);
  useEffect(handleTextReplacements(props.textReplacements, editor), [
    editor,
    props.textReplacements
  ]);
  useEffect(handleEditorEvents(editor, version, setVersion), [editor, version]);

  useEffect(handleSelectedWordChanges(editor, props.onWordSelected), [
    editor,
    props.onWordSelected
  ]);
  useEffect(handleTextReplacements(props.textReplacements, editor), [
    editor,
    props.textReplacements
  ]);
  useEffect(handleEditorEvents(editor, version, setVersion), [editor, version]);

  return (
    <div className={props.className}>
      <MonacoEditor
        language={LYRICISTANT_LANGUAGE}
        editorDidMount={editorDidMount}
        options={{
          lineNumbers: (line: number): string =>
            syllable(editor.getModel().getLineContent(line)).toString(),
          fontSize: props.fontSize,
          automaticLayout: true,
          overviewRulerBorder: false,
          occurrencesHighlight: false,
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          quickSuggestions: false,
          hideCursorInOverviewRuler: true,
          minimap: {
            enabled: false
          }
        }}
      />
    </div>
  );
};

function handleSelectedWordChanges(
  editor: monaco.editor.IStandaloneCodeEditor,
  onWordSelected: (word: WordAtPosition) => void
): () => () => void {
  return () => {
    if (!editor) {
      return;
    }
    const cursorChanges: Observable<WordAtPosition> = merge(
      fromEventPattern((handler: NodeEventHandler) =>
        editor.onDidChangeCursorPosition(handler)
      ),
      cursorUpdateKicker
    ).pipe(
      map(
        (): WordAtPosition => {
          const cursorPosition: monaco.IPosition = editor.getPosition();
          const wordAndColumns: monaco.editor.IWordAtPosition | null = editor
            .getModel()
            .getWordAtPosition(cursorPosition);

          if (!wordAndColumns) {
            return undefined;
          }

          return {
            word: wordAndColumns.word,
            range: new monaco.Range(
              cursorPosition.lineNumber,
              wordAndColumns.startColumn,
              cursorPosition.lineNumber,
              wordAndColumns.endColumn
            )
          };
        }
      ),
      filter((value: WordAtPosition) => !!value)
    );
    const selectionChanges: Observable<WordAtPosition> = fromEventPattern(
      (handler: NodeEventHandler) => editor.onDidChangeCursorSelection(handler)
    ).pipe(
      map(() => {
        const selectionRange: monaco.IRange = editor.getSelection();

        return {
          word: editor.getModel().getValueInRange(selectionRange),
          range: selectionRange
        };
      }),
      filter((value: WordAtPosition) => {
        return (
          value.word.length > 1 &&
          value.word.charAt(0).match(/\w/) !== undefined
        );
      })
    );

    const subscription = merge(selectionChanges, cursorChanges)
      .pipe(distinctUntilChanged())
      .subscribe(onWordSelected);

    return () => subscription.unsubscribe();
  };
}

function handleTextReplacements(
  textReplacements: Observable<TextReplacement>,
  editor: monaco.editor.IStandaloneCodeEditor
): () => void {
  return () => {
    if (!editor) {
      return;
    }

    const subscription = textReplacements.subscribe(
      (replacement: TextReplacement): void => {
        editor.focus();
        const op: monaco.editor.IIdentifiedSingleEditOperation = {
          range: convertToRange(replacement.range),
          text: replacement.word,
          forceMoveMarkers: true
        };
        editor.executeEdits('', [op]);
        cursorUpdateKicker.next(undefined);
      }
    );

    return () => subscription.unsubscribe();
  };
}

function handleEditorEvents(
  editor: monaco.editor.IStandaloneCodeEditor,
  lastKnownVersion: number,
  setVersion: (version: number) => void
): () => void {
  return () => {
    if (!editor) {
      return;
    }

    const onFileSaveEnded = (event: any, error: any, path: string) => {
      // Resets the undo stack.
      editor.getModel().setValue(editor.getModel().getValue());
      setVersion(editor.getModel().getAlternativeVersionId());

      if (path) {
        toast.info(`${path} saved`);
      }
    };
    ipcRenderer.on(IpcChannels.FILE_SAVE_ENDED, onFileSaveEnded);

    const onNewFileAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        ipcRenderer.send(IpcChannels.PROMPT_SAVE_FOR_NEW);
      } else {
        ipcRenderer.send(IpcChannels.OKAY_FOR_NEW_FILE);
      }
    };
    ipcRenderer.on(IpcChannels.ATTEMPT_NEW_FILE, onNewFileAttempt);

    const onQuitAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        ipcRenderer.send(IpcChannels.PROMPT_SAVE_FOR_QUIT);
      } else {
        ipcRenderer.send(IpcChannels.OKAY_FOR_QUIT);
      }
    };
    ipcRenderer.on(IpcChannels.ATTEMPT_QUIT, onQuitAttempt);

    const onNewFileCreated = () => {
      editor.getModel().setValue('');
      setVersion(editor.getModel().getAlternativeVersionId());
    };
    ipcRenderer.on(IpcChannels.NEW_FILE_CREATED, onNewFileCreated);

    const onFileOpened = (
      _: any,
      error: any,
      fileName: string,
      fileContents: string
    ) => {
      if (!error) {
        editor.getModel().setValue(fileContents);
        setVersion(editor.getModel().getAlternativeVersionId());
      }
    };
    ipcRenderer.on(IpcChannels.FILE_OPENED, onFileOpened);

    const onTextRequested = () => {
      ipcRenderer.send(IpcChannels.EDITOR_TEXT, editor.getModel().getValue());
    };
    ipcRenderer.on(IpcChannels.REQUEST_EDITOR_TEXT, onTextRequested);

    const onUndo = () => editor.trigger('', 'undo', '');
    ipcRenderer.on(IpcChannels.UNDO, onUndo);

    const onRedo = () => editor.trigger('', 'redo', '');
    ipcRenderer.on(IpcChannels.REDO, onRedo);

    const onFind = () => editor.trigger('', 'actions.findWithSelection', '');
    ipcRenderer.on(IpcChannels.FIND, onFind);

    const onReplace = () =>
      editor.trigger('', 'editor.action.startFindReplaceAction', '');
    ipcRenderer.on(IpcChannels.REPLACE, onReplace);

    return () => {
      ipcRenderer.removeListener(IpcChannels.FILE_SAVE_ENDED, onFileSaveEnded);
      ipcRenderer.removeListener(
        IpcChannels.ATTEMPT_NEW_FILE,
        onNewFileAttempt
      );
      ipcRenderer.removeListener(IpcChannels.ATTEMPT_QUIT, onQuitAttempt);
      ipcRenderer.removeListener(
        IpcChannels.NEW_FILE_CREATED,
        onNewFileCreated
      );
      ipcRenderer.removeListener(IpcChannels.FILE_OPENED, onFileOpened);
      ipcRenderer.removeListener(
        IpcChannels.REQUEST_EDITOR_TEXT,
        onTextRequested
      );
      ipcRenderer.removeListener(IpcChannels.UNDO, onUndo);
      ipcRenderer.removeListener(IpcChannels.REDO, onRedo);
      ipcRenderer.removeListener(IpcChannels.FIND, onFind);
      ipcRenderer.removeListener(IpcChannels.REPLACE, onReplace);
    };
  };
}

function convertToRange(range: monaco.IRange): monaco.Range {
  return new monaco.Range(
    range.startLineNumber,
    range.startColumn,
    range.endLineNumber,
    range.endColumn
  );
}
