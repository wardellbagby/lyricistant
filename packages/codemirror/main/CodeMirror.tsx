import {
  defaultKeymap,
  history,
  historyKeymap,
  redo as redoTextChange,
  undo as undoTextChange,
  undoDepth,
} from '@codemirror/commands';
import { openSearchPanel, searchKeymap } from '@codemirror/search';
import {
  Compartment,
  EditorState,
  EditorStateConfig,
  Extension,
  Text,
} from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { useTheme } from '@mui/material';
import { sample } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { editorTheme } from './editorTheme';
import { syllableCounts } from './syllableCounts';
import { textSelection, TextSelectionData } from './textSelection';

export { Text };

const placeholders = [
  'Type your lyrics...',
  'Write your epic...',
  'Show me your poetry...',
  'Jot down your thoughts...',
  'Input musings here...',
  'Pen your next masterpiece...',
  "Let's write some rhymes...",
  "Let's start your song...",
  'Tell me your story...',
  'Speak (err, write?) your mind...',
  'Let me assist your lyrics...',
  'Create your next classic...',
  "Let's make your magnum opus...",
  'What do you want to write today?',
  'Put your feelings to words...',
];
const textChanged = (onTextChanged: (text: Text) => void) =>
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onTextChanged(update.state.doc);
    }
  });

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
  }, [view?.dispatch, compartment, extension]);
};

export interface CodeMirrorEditorProps {
  text: Text;
  cursorPosition?: number;
  font: string;
  onWordSelected: (word: TextSelectionData) => void;
  onTextChanged: (text: Text) => void;
  onFileDropped: (item: DataTransferItem | File) => void;
}

export const useCodeMirror = (props: CodeMirrorEditorProps) => {
  const [view, setView] = useState<EditorView>(null);
  const [container, setContainer] = useState<HTMLDivElement>(null);
  const [resetCount, setResetCount] = useState(0);

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
    () => textSelection(props.onWordSelected),
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
        placeholder(sample(placeholders)),
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
      resetCount,
    ]
  );

  useEffect(() => {
    if (!container) {
      return;
    }

    const newView = new EditorView({
      parent: container,
    });
    newView.setState(
      EditorState.create({
        ...defaultConfig,
        doc: props.text,
      })
    );
    setView(newView);

    return () => {
      if (!container) {
        setView(null);
        newView.destroy();
      }
    };
  }, [container]);

  useEffect(() => {
    const currentText = view ? view.state.doc : Text.empty;
    if (view && !props.text.eq(currentText)) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentText.length,
          insert: props.text ?? Text.empty,
        },
      });
    }
  }, [props.text, view]);

  useEffect(() => {
    if (
      view &&
      props.cursorPosition !== undefined &&
      view.state.selection.main.anchor !== props.cursorPosition
    ) {
      view.dispatch({
        selection: {
          anchor: props.cursorPosition,
        },
      });
    }
  }, [props.cursorPosition, view]);

  useReconfigurableExtension(view, themeCompartment, themeExtension);
  useReconfigurableExtension(view, textCompartment, textChangedExtension);
  useReconfigurableExtension(view, selectionCompartment, selectionExtension);
  useReconfigurableExtension(
    view,
    fileDroppedCompartment,
    fileDroppedExtension
  );

  useEffect(() => {
    if (!container) {
      return;
    }

    Array.from(container.getElementsByClassName('cm-content')).forEach(
      (element) => {
        element.setAttribute('spellcheck', 'on');
        element.setAttribute('autocorrect', 'on');
        element.setAttribute('autocapitalize', 'on');
      }
    );
  }, [container]);

  const resetHistory = useCallback(() => {
    setResetCount((count) => count + 1);
    return view?.setState(
      EditorState.create({ ...defaultConfig, doc: props.text })
    );
  }, [view, defaultConfig, props.text]);
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
    setContainer,
  };
};
