import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { useCodeMirror } from '@lyricistant/codemirror/CodeMirror';
import { EditorView } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { Font } from '@lyricistant/common/preferences/PreferencesData';
import { toPlatformFile } from './to-platform-file';
import { useReplacedWords, useSelectedWordStore } from './SelectedWordStore';
import { useEditorText, useEditorTextStore } from './EditorTextStore';
import { styled } from '@mui/material';
import { WordAtPosition } from '@lyricistant/codemirror/wordSelection';

const fontFamily = (font?: Font) => {
  switch (font) {
    case Font.Roboto:
      return 'Roboto';
    default:
      return 'Roboto Mono';
  }
};
const EditorContainer = styled('div')({
  height: '100%',
  width: '100%',
  paddingTop: '8px',
});

export interface EditorTextData {
  text: string;
  /**
   * Does this represent a change from the last text data, or should this be
   * considered brand new?
   *
   * TODO This cannot be a good name...
   */
  isTransactional?: boolean;
}
export interface EditorProps {
  value: EditorTextData;
  onTextChange: (value: EditorTextData) => void;
  onWordSelected: (word: WordAtPosition) => void;
  onModificationStateChanged: (isModified: boolean) => void;
}
export const Editor: React.FC<EditorProps> = (props) => {
  const editor = useRef();
  const [themeData] = useChannelData('theme-updated');
  const onFileDropped = useCallback((item: DataTransferItem | File) => {
    logger.debug('Attempted to drop a file.');
    toPlatformFile(item)
      .then((file) => platformDelegate.send('open-file-attempt', file))
      .catch((reason) => {
        logger.error(reason);
      });
  }, []);

  const onTextChanged = useCallback((text: string) => {
    props.onTextChange({
      text,
      isTransactional: true,
    });
  }, []);
  const { isModified, resetHistory, redo, undo, openFindReplaceDialog } =
    useCodeMirror({
      text: props.value.text,
      container: editor.current,
      onTextChanged,
      onFileDropped,
      onWordSelected: props.onWordSelected,
      font: fontFamily(themeData?.font),
    });

  useEffect(() => props.onModificationStateChanged(isModified), [isModified]);
  useEffect(() => {
    if (!props.value.isTransactional) {
      resetHistory();
    }
  }, [props.value.isTransactional]);

  useTextActionEvents(undo, redo, openFindReplaceDialog);
  useBeforeUnload(() => {
    if (isModified) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });
  return <EditorContainer ref={editor} />;
};

const useTextActionEvents = (
  undo: () => void,
  redo: () => void,
  openFindReplaceModal: () => void
) => {
  useEffect(() => {
    const onUndo = () => undo();
    platformDelegate.on('undo', onUndo);

    const onRedo = () => redo();
    platformDelegate.on('redo', onRedo);

    const onFind = () => openFindReplaceModal;
    platformDelegate.on('find', onFind);

    const onReplace = () => openFindReplaceModal;
    platformDelegate.on('replace', onReplace);

    return () => {
      platformDelegate.removeListener('undo', onUndo);
      platformDelegate.removeListener('redo', onRedo);
      platformDelegate.removeListener('find', onFind);
      platformDelegate.removeListener('replace', onReplace);
    };
  }, [undo, redo, openFindReplaceModal]);
};
