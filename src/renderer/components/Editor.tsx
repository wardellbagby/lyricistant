import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { toast } from 'react-toastify';
import { fromEventPattern, merge, Observable, Subject } from 'rxjs';
import { NodeEventHandler } from 'rxjs/internal/observable/fromEvent';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import syllable from 'syllable';
import { LYRICISTANT_LANGUAGE } from '../util/monaco-helpers';

export interface TextReplacement {
  word: string;
  range: monaco.IRange;
}

export interface WordAtPosition {
  range: monaco.IRange;
  word: string;
}

export interface EditorProps {
  text: string;
  fontSize: number;
  onWordSelected: (word: WordAtPosition) => void;
  onTextChanged: (text: string) => void;
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
    <MonacoEditor
      language={LYRICISTANT_LANGUAGE}
      editorDidMount={editorDidMount}
      defaultValue={props.text}
      onChange={props.onTextChanged}
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

    const onFileSaveEnded = (error: any, path: string) => {
      // Resets the undo stack.
      editor.getModel().setValue(editor.getModel().getValue());
      setVersion(editor.getModel().getAlternativeVersionId());

      if (path) {
        toast.info(`${path} saved`);
      }
    };
    platformDelegate.on('file-save-ended', onFileSaveEnded);

    const onNewFileAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        platformDelegate.send('prompt-save-file-for-new');
      } else {
        platformDelegate.send('okay-for-new-file');
      }
    };
    platformDelegate.on('new-file', onNewFileAttempt);

    const onQuitAttempt = () => {
      if (lastKnownVersion !== editor.getModel().getAlternativeVersionId()) {
        platformDelegate.send('prompt-save-file-for-quit');
      } else {
        platformDelegate.send('okay-for-quit');
      }
    };
    platformDelegate.on('attempt-quit', onQuitAttempt);

    const onNewFileCreated = () => {
      editor.getModel().setValue('');
      setVersion(editor.getModel().getAlternativeVersionId());
    };
    platformDelegate.on('new-file-created', onNewFileCreated);

    const onFileOpened = (
      error: Error,
      fileName: string,
      fileContents: string
    ) => {
      if (!error) {
        editor.getModel().setValue(fileContents);
        setVersion(editor.getModel().getAlternativeVersionId());
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onTextRequested = () => {
      platformDelegate.send('editor-text', editor.getModel().getValue());
    };
    platformDelegate.on('request-editor-text', onTextRequested);

    const onUndo = () => editor.trigger('', 'undo', '');
    platformDelegate.on('undo', onUndo);

    const onRedo = () => editor.trigger('', 'redo', '');
    platformDelegate.on('redo', onRedo);

    const onFind = () => editor.trigger('', 'actions.findWithSelection', '');
    platformDelegate.on('find', onFind);

    const onReplace = () =>
      editor.trigger('', 'editor.action.startFindReplaceAction', '');
    platformDelegate.on('replace', onReplace);

    return () => {
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
      platformDelegate.removeListener('new-file', onNewFileAttempt);
      platformDelegate.removeListener('attempt-quit', onQuitAttempt);
      platformDelegate.removeListener('new-file-created', onNewFileCreated);
      platformDelegate.removeListener('file-opened', onFileOpened);
      platformDelegate.removeListener('request-editor-text', onTextRequested);
      platformDelegate.removeListener('undo', onUndo);
      platformDelegate.removeListener('redo', onRedo);
      platformDelegate.removeListener('find', onFind);
      platformDelegate.removeListener('replace', onReplace);
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
