import { styled, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CodeMirror from 'codemirror';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/selection/mark-selection';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import { useSnackbar } from 'notistack';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { Controlled as CodeMirrorEditor } from 'react-codemirror2';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import syllable from 'syllable';
import 'typeface-roboto-mono';
import { appComponent } from '../globals';
import { useDocumentListener } from '../hooks/useEventListener';
import { findWordAt, LYRICISTANT_LANGUAGE } from '../util/editor-helpers';
import { toDroppableFile } from '../util/to-droppable-file';

export interface TextReplacement {
  word: string;
  range: CodeMirror.Range;
}

export interface WordAtPosition {
  range: CodeMirror.Range;
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

const EditorContainer = styled('div')({
  height: '100%',
  width: '100%',
});

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: '100%',
    width: '100%',
    '& .CodeMirror': {
      height: '100%',
      background: theme.palette.background.default,
      color: theme.palette.text.primary,
      fontSize: theme.typography.fontSize,
      fontFamily: "'Roboto Mono'",
    },
    '& .CodeMirror-dialog input': {
      fontSize: theme.typography.fontSize,
      fontFamily: "'Roboto Mono'",
    },
    '& .CodeMirror-linenumber': {
      color: theme.palette.text.secondary,
    },
    '& .CodeMirror-gutters': {
      background: theme.palette.background.default,
      'border-style': 'none',
      width: '60px',
      'text-align': 'center',
    },
    '& .CodeMirror-cursor': {
      'border-left': `1px solid ${theme.palette.text.primary};`,
    },
    '& .CodeMirror-guttermarker': {
      color: theme.palette.background.default,
    },
    '& .CodeMirror-selectedtext': {
      color: theme.palette.getContrastText(theme.palette.primary.main),
    },
    '& .CodeMirror-selected': {
      'background-color': [[theme.palette.primary.main], '!important'],
    },
  },
}));

export const Editor: FunctionComponent<EditorProps> = (props: EditorProps) => {
  const [editor, setEditor] = useState(null as CodeMirror.Editor);
  const [version, setVersion] = useState(0);
  const editorDidMount = (editorInstance: CodeMirror.Editor): void => {
    setEditor(editorInstance);
    // @ts-ignore
    editorInstance.setOption('styleSelectedText', true);
    // @ts-ignore
    editorInstance.setOption('search', true);
    setVersion(editorInstance.changeGeneration(true));
    CodeMirror.registerHelper('wordChars', LYRICISTANT_LANGUAGE, /[a-zA-Z-']+/);
  };
  const classes = useStyles();

  useDocumentListener(
    'drop',
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.dataTransfer?.files?.length > 0) {
        appComponent.get<Logger>().debug('Attempted to drop a file.');
        const file = await toDroppableFile(event.dataTransfer.files.item(0));
        if (!editor.isClean(version)) {
          platformDelegate.send('prompt-save-file-for-open', file);
          return;
        }

        platformDelegate.send('open-file-attempt', file);
      }
    },
    [editor]
  );
  useDocumentListener(
    'dragover',
    (event) => {
      event.preventDefault();
      return true;
    },
    [editor]
  );
  useEffect(handleSelectedWordChanges(editor, props.onWordSelected), [
    editor,
    props.onWordSelected,
  ]);
  useEffect(handleTextReplacements(props.textReplacements, editor), [
    editor,
    props.textReplacements,
  ]);
  useEffect(handleEditorEvents(editor, version, setVersion), [editor, version]);
  useBeforeUnload(() => {
    if (!editor.isClean(version)) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });

  return (
    <EditorContainer>
      <CodeMirrorEditor
        className={classes.root}
        value={props.text}
        defineMode={{
          name: LYRICISTANT_LANGUAGE,
          fn: () => {
            return {
              name: LYRICISTANT_LANGUAGE,
              token: (stream) => stream.next(),
            };
          },
        }}
        options={{
          mode: LYRICISTANT_LANGUAGE,
          lineNumbers: true,
          lineWrapping: true,
          lineNumberFormatter: (line: number): string => {
            if (!editor) {
              return `${line}`;
            }
            return syllable(editor.getLine(line - 1)).toString();
          },
          dragDrop: false,
        }}
        editorDidMount={editorDidMount}
        onBeforeChange={(editorInstance, _, value) => {
          props.onTextChanged(value);
        }}
      />
    </EditorContainer>
  );
};

function handleSelectedWordChanges(
  editor: CodeMirror.Editor,
  onWordSelected: (word: WordAtPosition) => void
) {
  return () => {
    if (!editor) {
      return;
    }

    const cursorChanges: Observable<WordAtPosition> = merge(
      fromEvent(editor, 'cursorActivity'),
      cursorUpdateKicker
    ).pipe(
      map(() => {
        const cursorPosition = editor.getCursor('from');
        const foundWord = findWordAt(editor, cursorPosition);

        if (!foundWord || foundWord.empty()) {
          return undefined;
        }

        return foundWord;
      }),
      filter((value) => !!value)
    );

    const subscription = cursorChanges
      .pipe(distinctUntilChanged())
      .subscribe(onWordSelected);

    return () => subscription.unsubscribe();
  };
}

function handleTextReplacements(
  textReplacements: Observable<TextReplacement>,
  editor: CodeMirror.Editor
) {
  return () => {
    if (!editor) {
      return;
    }

    const subscription = textReplacements.subscribe(
      (replacement: TextReplacement): void => {
        editor.focus();
        editor.replaceRange(
          replacement.word,
          replacement.range.from(),
          replacement.range.to()
        );
        cursorUpdateKicker.next(undefined);
      }
    );

    return () => subscription.unsubscribe();
  };
}

function handleEditorEvents(
  editor: CodeMirror.Editor,
  lastKnownVersion: number,
  setVersion: (version: number) => void
) {
  const { enqueueSnackbar } = useSnackbar();
  return () => {
    if (!editor) {
      return;
    }

    const onFileSaveEnded = (error: any, path: string) => {
      // Resets the undo stack.
      editor.clearHistory();
      setVersion(editor.changeGeneration(true));

      if (path) {
        enqueueSnackbar(`${path} saved`, { variant: 'success' });
      }
    };
    platformDelegate.on('file-save-ended', onFileSaveEnded);

    const onNewFileAttempt = () => {
      if (editor.isClean(lastKnownVersion)) {
        platformDelegate.send('okay-for-new-file');
      } else {
        platformDelegate.send('prompt-save-file-for-new');
      }
    };
    platformDelegate.on('is-okay-for-new-file', onNewFileAttempt);

    const onQuitAttempt = () => {
      if (editor.isClean(lastKnownVersion)) {
        platformDelegate.send('okay-for-quit');
      } else {
        platformDelegate.send('prompt-save-file-for-quit');
      }
    };
    platformDelegate.on('is-okay-for-quit-file', onQuitAttempt);

    const onNewFileCreated = () => {
      editor.setValue('');
      editor.clearHistory();
      setVersion(editor.changeGeneration(true));
    };
    platformDelegate.on('new-file-created', onNewFileCreated);

    const onFileOpened = (
      error: Error,
      fileName: string,
      fileContents: string
    ) => {
      if (!error) {
        editor.setValue(fileContents);
        editor.clearHistory();
        setVersion(editor.changeGeneration(true));
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onTextRequested = () => {
      platformDelegate.send('editor-text', editor.getValue());
    };
    platformDelegate.on('request-editor-text', onTextRequested);

    const onUndo = () => editor.undo();
    platformDelegate.on('undo', onUndo);

    const onRedo = () => editor.redo();
    platformDelegate.on('redo', onRedo);

    const onFind = () => editor.execCommand('find');
    platformDelegate.on('find', onFind);

    const onReplace = () => editor.execCommand('replace');
    platformDelegate.on('replace', onReplace);

    return () => {
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
      platformDelegate.removeListener('is-okay-for-new-file', onNewFileAttempt);
      platformDelegate.removeListener('is-okay-for-quit-file', onQuitAttempt);
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
