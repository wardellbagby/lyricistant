import React, { useEffect, useRef, useState } from 'react';
import { EditorState, tagExtension } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { history, historyKeymap } from '@codemirror/history';
import { styled, useTheme } from '@material-ui/core';
import 'typeface-roboto-mono';
import { editorTheme } from './editorTheme';

const EditorContainer = styled('div')({
  height: '100%',
  width: '100%',
});
// const useStyles = makeStyles((theme: Theme) => ({
//   root: {
//     height: '100%',
//     width: '100%',
//     '& .CodeMirror': {
//       height: '100%',
//       background: theme.palette.background.default,
//       color: theme.palette.text.primary,
//       fontSize: theme.typography.fontSize,
//       fontFamily: "'Roboto Mono'",
//     },
//     '& .CodeMirror-dialog input': {
//       fontSize: theme.typography.fontSize,
//       fontFamily: "'Roboto Mono'",
//     },
//     '& .CodeMirror-linenumber': {
//       color: theme.palette.text.secondary,
//     },
//     '& .CodeMirror-gutters': {
//       background: theme.palette.background.default,
//       'border-style': 'none',
//       width: '60px',
//       'text-align': 'center',
//     },
//     '& .CodeMirror-cursor': {
//       'border-left': `1px solid ${theme.palette.text.primary};`,
//     },
//     '& .CodeMirror-guttermarker': {
//       color: theme.palette.background.default,
//     },
//     '& .CodeMirror-selectedtext': {
//       color: theme.palette.getContrastText(theme.palette.primary.main),
//     },
//     '& .CodeMirror-selected': {
//       'background-color': [[theme.palette.primary.main], '!important'],
//     },
//     '& .CodeMirror-empty': {
//       color: theme.palette.action.disabled,
//     },
//   },
// }));

export function CodeMirror6Editor() {
  const ref = useRef<HTMLDivElement>();
  const [editor, setEditor] = useState<EditorView>(null);
  const appTheme = useTheme();
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (!editor) {
      setEditor(
        new EditorView({
          state: EditorState.create({
            extensions: [
              tagExtension('theme', EditorView.theme({})),
              history(),
              keymap.of([...defaultKeymap, ...historyKeymap]),
            ],
          }),
          parent: ref.current,
        })
      );
    }

    return () => {
      if (!ref.current) {
        editor.destroy();
        setEditor(null);
      }
    };
  }, [editor, setEditor]);
  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.dispatch({
      reconfigure: {
        theme: editorTheme(appTheme),
      },
    });
  }, [editor, appTheme]);
  return <EditorContainer ref={ref} />;
}
