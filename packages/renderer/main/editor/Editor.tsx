import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { CodeMirrorEditor } from '@lyricistant/codemirror/CodeMirror';
import { EditorView } from '@codemirror/view';
import { redo, undo, undoDepth } from '@codemirror/history';
import { EditorState, EditorStateConfig } from '@codemirror/state';
import { openSearchPanel } from '@codemirror/search';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { Font } from '@lyricistant/common/preferences/PreferencesData';
import { toPlatformFile } from './to-platform-file';
import { useReplacedWords, useSelectedWordStore } from './SelectedWordStore';
import { useEditorTextStore } from './EditorTextStore';

const fontFamily = (font?: Font) => {
  switch (font) {
    case Font.Roboto:
      return 'Roboto';
    default:
      return 'Roboto Mono';
  }
};
export const Editor: React.FC = () => {
  const [editor, setEditor] = useState<EditorView>(null);
  const [defaultConfig, setDefaultConfig] = useState<EditorStateConfig>(null);
  const [themeData] = useChannelData('theme-updated');
  const onFileDropped = useCallback(
    (view: EditorView, item: DataTransferItem | File) => {
      if (!view) {
        logger.debug("Attempted to drop a file but editor wasn't set");
        return;
      }
      logger.debug('Attempted to drop a file.');
      toPlatformFile(item)
        .then((file) => platformDelegate.send('open-file-attempt', file))
        .catch((reason) => {
          logger.error(reason);
        });
    },
    []
  );

  useEffect(handleEditorEvents(editor, defaultConfig), [editor, defaultConfig]);
  useBeforeUnload(() => {
    if (editor && undoDepth(editor.state) !== 0) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });
  const store = useSelectedWordStore();
  const { onEditorText } = useEditorTextStore();
  return (
    <CodeMirrorEditor
      font={fontFamily(themeData?.font)}
      onEditorMounted={setEditor}
      onWordSelected={store.onWordSelected}
      wordReplacement={useReplacedWords()}
      onDefaultConfigReady={setDefaultConfig}
      onTextChanged={onEditorText}
      onFileDropped={onFileDropped}
    />
  );
};

function handleEditorEvents(
  editor: EditorView,
  defaultConfig: EditorStateConfig
) {
  const { enqueueSnackbar } = useSnackbar();
  return () => {
    if (!editor) {
      return;
    }

    const onCheckFileModified = () => {
      platformDelegate.send('is-file-modified', undoDepth(editor.state) > 0);
    };
    platformDelegate.on('check-file-modified', onCheckFileModified);

    const onFileSaveEnded = (error: any, path: string) => {
      // Resets the undo stack.
      editor.setState(
        EditorState.create({
          ...defaultConfig,
          doc: editor.state.doc,
        })
      );

      if (path) {
        enqueueSnackbar(`${path} saved`, { variant: 'success' });
      }
    };
    platformDelegate.on('file-save-ended', onFileSaveEnded);

    const onNewFileCreated = () => {
      editor.setState(EditorState.create(defaultConfig));
    };
    platformDelegate.on('new-file-created', onNewFileCreated);

    const onFileOpened = (
      error: Error,
      fileContents: string,
      clearHistory: boolean
    ) => {
      if (!error) {
        if (clearHistory) {
          editor.setState(
            EditorState.create({
              ...defaultConfig,
              doc: fileContents,
            })
          );
        } else {
          editor.dispatch({
            changes: {
              from: 0,
              to: editor.state.doc.length,
              insert: fileContents,
            },
          });
        }
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onTextRequested = () => {
      platformDelegate.send('editor-text', editor.state.doc.toString());
    };
    platformDelegate.on('request-editor-text', onTextRequested);

    const onUndo = () => undo(editor);
    platformDelegate.on('undo', onUndo);

    const onRedo = () => redo(editor);
    platformDelegate.on('redo', onRedo);

    const onFind = () => openSearchPanel(editor);
    platformDelegate.on('find', onFind);

    const onReplace = () => openSearchPanel(editor);
    platformDelegate.on('replace', onReplace);

    return () => {
      platformDelegate.removeListener(
        'check-file-modified',
        onCheckFileModified
      );
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
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
