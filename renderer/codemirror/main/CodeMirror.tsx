import React, { useEffect, useRef, useState } from 'react';
import { EditorSelection, EditorState, tagExtension } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { history, historyKeymap } from '@codemirror/history';
import { styled, useTheme } from '@material-ui/core';
import 'typeface-roboto-mono';
import { editorTheme } from './editorTheme';
import { syllableCounts } from './syllableCounts';
import { WordAtPosition, wordSelection } from './wordSelection';

const EditorContainer = styled('div')({
  height: '100%',
  width: '100%',
});

export interface WordReplacement {
  originalWord: WordAtPosition;
  newWord: string;
}

interface Props {
  onWordSelected?: (word: WordAtPosition) => void;
  wordReplacement?: WordReplacement;
}

export function CodeMirror6Editor(props: Props) {
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
            wordSelection({
              onWordSelected: props.onWordSelected,
            }),
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
  useEffect(() => {
    if (!view || !props.wordReplacement) {
      return;
    }
    const {
      originalWord: { from, to },
      newWord: insert,
    } = props.wordReplacement;
    const changes = view.state.changes({
      from: Math.max(0, from),
      to: Math.min(to, view.state.doc.length),
      insert,
    });
    const selection = EditorSelection.cursor(
      changes.mapPos(Math.min(to, view.state.doc.length))
    );
    view.dispatch({
      changes,
      selection,
    });
  }, [view, props.wordReplacement, props.onWordSelected]);
  return <EditorContainer ref={ref} />;
}
