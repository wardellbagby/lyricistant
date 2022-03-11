import { useCodeMirror } from '@lyricistant/codemirror/CodeMirror';
import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { Font } from '@lyricistant/common/preferences/PreferencesData';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { styled } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';
import { toPlatformFile } from './to-platform-file';

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
  onTextChanged: (value: EditorTextData) => void;
  onTextSelected: (value: TextSelectionData) => void;
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
    props.onTextChanged({
      text,
      isTransactional: true,
    });
  }, []);
  const {
    isModified,
    resetHistory,
    redo,
    undo,
    openFindReplaceDialog,
    setContainer,
  } = useCodeMirror({
    text: props.value.text,
    onTextChanged,
    onFileDropped,
    onWordSelected: props.onTextSelected,
    font: fontFamily(themeData?.font),
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  useEffect(() => props.onModificationStateChanged(isModified), [isModified]);
  useEffect(() => {
    if (!props.value.isTransactional) {
      resetHistory();
    }
  }, [props.value]);

  useTextActionEvents(undo, redo, openFindReplaceDialog);
  return <EditorContainer ref={editor} />;
};

const useTextActionEvents = (
  undo: () => void,
  redo: () => void,
  openFindReplaceModal: () => void
) => {
  useEffect(() => {
    platformDelegate.on('undo', undo);
    platformDelegate.on('redo', redo);
    platformDelegate.on('find', openFindReplaceModal);
    platformDelegate.on('replace', openFindReplaceModal);

    return () => {
      platformDelegate.removeListener('undo', undo);
      platformDelegate.removeListener('redo', redo);
      platformDelegate.removeListener('find', openFindReplaceModal);
      platformDelegate.removeListener('replace', openFindReplaceModal);
    };
  }, [undo, redo, openFindReplaceModal]);
};
