import React, { useEffect, useRef, useState } from 'react';
import { EditorState, tagExtension } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { history, historyKeymap } from '@codemirror/history';
import { styled, useTheme } from '@material-ui/core';
import 'typeface-roboto-mono';
import { editorTheme } from './editorTheme';
import { syllableCounts } from './syllableCounts';

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
  const [view, setView] = useState<EditorView>(null);
  const appTheme = useTheme();
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (!view) {
      const newView = new EditorView({
        parent: ref.current,
      });
      newView.setState(
        EditorState.create({
          extensions: [
            syllableCounts(() => newView.state.doc),
            tagExtension('theme', EditorView.theme({})),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
          ],
        })
      );
      setView(newView);
    }

    return () => {
      if (!ref.current) {
        view.destroy();
        setView(null);
      }
    };
  }, [view, setView]);
  useEffect(() => {
    if (!view) {
      return;
    }
    view.dispatch({
      reconfigure: {
        theme: editorTheme(appTheme),
      },
    });
  }, [view, appTheme]);
  return <EditorContainer ref={ref} />;
}
