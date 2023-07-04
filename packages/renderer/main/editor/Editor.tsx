import { useCodeMirror, Text } from '@lyricistant/codemirror/CodeMirror';
import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { Font } from '@lyricistant/common/preferences/PreferencesData';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { Box, styled, useTheme } from '@mui/material';
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
  flex: '1 1 500px',
  minHeight: '50px',
  position: 'relative',
});

interface EdgeFadeProps {
  endColor: string;
  towards: 'top' | 'bottom';
}
const EdgeFade = ({ endColor, towards }: EdgeFadeProps) => {
  const startColor = `#00${endColor.slice(1)}`;
  const rotation = towards === 'bottom' ? '180deg' : '0deg';

  return (
    <Box
      sx={{
        content: "''",
        height: '24px',
        width: '100%',
        background: `linear-gradient(${rotation}, ${startColor} 0%, ${endColor} 100%)`,
        position: 'absolute',
        zIndex: 1,
        top: towards === 'top' ? '0' : undefined,
        bottom: towards === 'bottom' ? '0' : undefined,
      }}
    />
  );
};

export interface EditorTextData {
  /** The text to be displayed in the editor. */
  text: Text;
  /**
   * Does this represent a change from the last text data, or should this be
   * considered brand new?
   *
   * TODO This cannot be a good name...
   */
  isTransactional?: boolean;
  cursorPosition?: number;
}

/** The props for the {@link Editor} component. */
export interface EditorProps {
  /** The value to be represented in the editor. */
  value: EditorTextData;
  /**
   * Invoked whenever the text changes.
   *
   * @param value The current text data in the editor.
   */
  onTextChanged: (value: EditorTextData) => void;
  /**
   * Invoked whenever the user selects text in the editor.
   *
   * "Selecting text" in this scenario means the more obvious action of the user
   * manually highlighting text and the less obvious action of the user moving
   * their cursor. In the case whether the user has moved their cursor but
   * didn't highlight any text, this will instead be the nearest "word" to their
   * cursor, where word is defined as a sequence of alphabetical characters.
   *
   * @param value The text currently selected by the user.
   */
  onTextSelected: (value: TextSelectionData) => void;
  /**
   * Invoked whenever the modification state changes.
   *
   * Modification state refers to whether the text in the editor has been
   * changed or not since the last value update where {@link isTransactional} is false.
   *
   * @param isModified Whether the editor has been modified or not.
   */
  onModificationStateChanged: (isModified: boolean) => void;
}

export const Editor: React.FC<EditorProps> = (props) => {
  const editor = useRef();
  const [themeData] = useChannelData('theme-updated');
  const theme = useTheme();
  const onFileDropped = useCallback((item: DataTransferItem | File) => {
    logger.debug('Attempted to drop a file.');
    toPlatformFile(item)
      .then((file) => platformDelegate.send('open-file-attempt', file))
      .catch((reason) => {
        logger.error(reason);
      });
  }, []);

  const onTextChanged = useCallback(
    (text: Text, cursorPosition: number) => {
      props.onTextChanged({
        text,
        cursorPosition,
        isTransactional: true,
      });
    },
    [props.onTextChanged]
  );
  const {
    isModified,
    resetHistory,
    redo,
    undo,
    openFindReplaceDialog,
    setContainer,
  } = useCodeMirror({
    text: props.value.text,
    cursorPosition: props.value.cursorPosition,
    onTextChanged,
    onFileDropped,
    onTextSelected: props.onTextSelected,
    font: fontFamily(themeData?.font),
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  useEffect(() => {
    props.onModificationStateChanged(isModified);
  }, [isModified]);
  useEffect(() => {
    if (!props.value.isTransactional) {
      resetHistory();
    }
  }, [props.value]);

  useTextActionEvents(undo, redo, openFindReplaceDialog);
  return (
    <EditorContainer ref={editor}>
      <Box
        sx={{ position: 'absolute', top: '0px', bottom: '0px', width: '100%' }}
      >
        <EdgeFade towards={'top'} endColor={theme.palette.background.default} />
        <EdgeFade
          towards={'bottom'}
          endColor={theme.palette.background.default}
        />
      </Box>
    </EditorContainer>
  );
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
