import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Compartment,
  EditorState,
  EditorStateConfig,
  Extension,
} from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import {
  history,
  historyKeymap,
  redo as redoTextChange,
  undo as undoTextChange,
  undoDepth,
} from '@codemirror/history';
import { useTheme } from '@mui/material';
import { openSearchPanel, searchKeymap } from '@codemirror/search';
import { editorTheme } from './editorTheme';
import { syllableCounts } from './syllableCounts';
import { WordAtPosition, wordSelection } from './wordSelection';

export interface WordReplacement {
  originalWord: WordAtPosition;
  newWord: string;
}

const textChanged = (onTextChanged: (text: string) => void) => {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onTextChanged(update.state.doc.toString());
    }
  });
};

const fileDropped = (onFileDropped: (item: DataTransferItem | File) => void) =>
  EditorView.domEventHandlers({
    drop: (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (
        event.dataTransfer?.items?.length > 0 ||
        event.dataTransfer?.files?.length > 0
      ) {
        onFileDropped(
          event.dataTransfer?.items?.[0] || event.dataTransfer?.files?.[0]
        );
      }
    },
  });

const useReconfigurableExtension = (
  view: EditorView,
  compartment: Compartment,
  extension: Extension
) => {
  useEffect(() => {
    if (!view) {
      return;
    }
    view.dispatch({
      effects: compartment.reconfigure(extension),
    });
  }, [view, compartment, extension]);
};

export interface CodeMirrorEditorProps {
  text: string;
  container: HTMLDivElement;
  font: string;
  onWordSelected: (word: WordAtPosition) => void;
  onTextChanged: (text: string) => void;
  onFileDropped: (item: DataTransferItem | File) => void;
}

export const useCodeMirror = (props: CodeMirrorEditorProps) => {
  const [view, setView] = useState<EditorView>(null);

  const appTheme = useTheme();
  const themeCompartment = useMemo(() => new Compartment(), []);
  const textCompartment = useMemo(() => new Compartment(), []);
  const selectionCompartment = useMemo(() => new Compartment(), []);
  const fileDroppedCompartment = useMemo(() => new Compartment(), []);

  const themeExtension = useMemo(
    () => editorTheme(appTheme, props.font),
    [appTheme, props.font]
  );
  const textChangedExtension = useMemo(
    () => textChanged(props.onTextChanged),
    [props.onTextChanged]
  );
  const selectionExtension = useMemo(
    () => wordSelection(props.onWordSelected),
    [props.onWordSelected]
  );
  const fileDroppedExtension = useMemo(
    () => fileDropped(props.onFileDropped),
    [props.onFileDropped]
  );

  /*
  When the view gets its state set explicitly set (like it does when its first
  created and whenever we need to clear the undo state), this is used to provide
  default extensions. This is not used for "transactional" updates, like prop
  changes. Only when view.setState is called.
  
  This still needs to be kept up to date on prop changes because we never know
  when a new state update is going to happen. In order to reconfigure (i.e.,
  recreate) an extension due to prop changes, rely on useReconfigurableExtension
  instead.
   */
  const defaultConfig = useMemo<EditorStateConfig>(
    () => ({
      extensions: [
        syllableCounts(),
        history(),
        EditorView.lineWrapping,
        placeholder('Type out some lyrics...'),
        themeCompartment.of(themeExtension),
        textCompartment.of(textChangedExtension),
        selectionCompartment.of(selectionExtension),
        fileDroppedCompartment.of(fileDroppedExtension),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      ],
    }),
    [
      appTheme,
      themeExtension,
      textChangedExtension,
      selectionExtension,
      fileDroppedExtension,
    ]
  );

  useEffect(() => {
    if (!props.container) {
      return;
    }

    const newView = new EditorView({
      parent: props.container,
    });
    newView.setState(
      EditorState.create({
        ...defaultConfig,
        doc: props.text,
      })
    );
    setView(newView);

    return () => {
      if (!props.container) {
        setView(null);
        newView.destroy();
      }
    };
  }, [props.container]);

  useEffect(() => {
    const currentText = view ? view.state.doc.toString() : '';
    if (view && props.text !== currentText) {
      view.dispatch({
        changes: { from: 0, to: currentText.length, insert: props.text || '' },
      });
    }
  }, [props.text, view]);

  useReconfigurableExtension(view, themeCompartment, themeExtension);
  useReconfigurableExtension(view, textCompartment, textChangedExtension);
  useReconfigurableExtension(view, selectionCompartment, selectionExtension);
  useReconfigurableExtension(
    view,
    fileDroppedCompartment,
    fileDroppedExtension
  );

  useEffect(() => {
    if (!props.container) {
      return;
    }

    Array.from(props.container.getElementsByClassName('cm-content')).forEach(
      (element) => {
        element.setAttribute('spellcheck', 'on');
        element.setAttribute('autocorrect', 'on');
        element.setAttribute('autocapitalize', 'on');
      }
    );
  }, [props.container]);

  const resetHistory = useCallback(
    () =>
      view?.setState(EditorState.create({ ...defaultConfig, doc: props.text })),
    [view, props.text]
  );
  const undo = useCallback(() => undoTextChange(view), [view]);
  const redo = useCallback(() => redoTextChange(view), [view]);
  const openFindReplaceDialog = useCallback(
    () => openSearchPanel(view),
    [view]
  );

  return {
    isModified: view?.state ? undoDepth(view.state) !== 0 : false,
    resetHistory,
    undo,
    redo,
    openFindReplaceDialog,
  };
};
