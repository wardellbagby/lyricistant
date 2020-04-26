import { browserIpc as ipcRenderer } from 'common/Ipc';
import { LYRICISTANT_LANGUAGE } from 'common/monaco-helpers';
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
    ipcRenderer.on('file-save-ended', onFileSaveEnded);

    const onNewFileAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        ipcRenderer.send('prompt-save-file-for-new');
      } else {
        ipcRenderer.send('okay-for-new-file');
      }
    };
    ipcRenderer.on('new-file', onNewFileAttempt);

    const onQuitAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        ipcRenderer.send('prompt-save-file-for-quit');
      } else {
        ipcRenderer.send('okay-for-quit');
      }
    };
    ipcRenderer.on('attempt-quit', onQuitAttempt);

    const onNewFileCreated = () => {
      editor.getModel().setValue('');
      setVersion(editor.getModel().getAlternativeVersionId());
    };
    ipcRenderer.on('new-file-created', onNewFileCreated);

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
    ipcRenderer.on('file-opened', onFileOpened);

    const onTextRequested = () => {
      ipcRenderer.send('editor-text', editor.getModel().getValue());
    };
    ipcRenderer.on('request-editor-text', onTextRequested);

    const onUndo = () => editor.trigger('', 'undo', '');
    ipcRenderer.on('undo', onUndo);

    const onRedo = () => editor.trigger('', 'redo', '');
    ipcRenderer.on('redo', onRedo);

    const onFind = () => editor.trigger('', 'actions.findWithSelection', '');
    ipcRenderer.on('find', onFind);

    const onReplace = () =>
      editor.trigger('', 'editor.action.startFindReplaceAction', '');
    ipcRenderer.on('replace', onReplace);

    return () => {
      ipcRenderer.removeListener('file-save-ended', onFileSaveEnded);
      ipcRenderer.removeListener('new-file', onNewFileAttempt);
      ipcRenderer.removeListener('attempt-quit', onQuitAttempt);
      ipcRenderer.removeListener('new-file-created', onNewFileCreated);
      ipcRenderer.removeListener('file-opened', onFileOpened);
      ipcRenderer.removeListener('request-editor-text', onTextRequested);
      ipcRenderer.removeListener('undo', onUndo);
      ipcRenderer.removeListener('redo', onRedo);
      ipcRenderer.removeListener('find', onFind);
      ipcRenderer.removeListener('replace', onReplace);
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
