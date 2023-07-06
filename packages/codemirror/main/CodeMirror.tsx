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
  RangeSet,
  StateEffect,
  StateField,
  Text,
} from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  placeholder,
} from '@codemirror/view';
import { Lyrics } from '@lyricistant/codemirror/lyrics-language';
import { useTheme } from '@mui/material';
import { differenceWith, isEqual, sample } from 'lodash-es';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
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

interface Mark {
  from: number;
  to: number;
}

const textChanged = (
  onTextChanged: (text: Text, cursorPosition: number) => void
) =>
  EditorView.updateListener.of((update) => {
    if (update.docChanged || update.selectionSet) {
      onTextChanged(update.state.doc, update.state.selection.main.from);
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

interface ReconfigurableExtension {
  compartment: Compartment;
  extension: Extension;
}

const useReconfigurableExtension = (
  view: EditorView,
  configs: ReconfigurableExtension[]
) => {
  const [lastConfigs, setLastConfigs] = useState<ReconfigurableExtension[]>([]);
  useLayoutEffect(() => {
    if (!view) {
      return;
    }

    const changedConfigs = differenceWith(configs, lastConfigs, isEqual);

    if (changedConfigs.length > 0) {
      view.dispatch({
        effects: changedConfigs.map(({ compartment, extension }) =>
          compartment.reconfigure(extension)
        ),
      });
      setLastConfigs(configs);
    }
  }, configs);
};

export interface CodeMirrorEditorProps {
  text: Text;
  cursorPosition?: number;
  font: string;
  markedText?: Mark;
  onTextSelected: (word: TextSelectionData) => void;
  onTextChanged: (text: Text, cursorPosition: number) => void;
  onFileDropped: (item: DataTransferItem | File) => void;
}

const markDecoration = Decoration.mark({ class: 'cm-mark' });
const addMark = StateEffect.define<Mark>({
  map: ({ from, to }, change) => ({
    from: change.mapPos(from),
    to: change.mapPos(to),
  }),
});

const isApplicableAddMarkEffect = (
  effect: StateEffect<Mark>,
  doc: Text
): boolean =>
  effect.value.from < doc.length &&
  effect.value.to <= doc.length &&
  effect.value.to - effect.value.from > 0;

const markStateField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(marks, tr) {
    for (const effect of tr.effects) {
      if (
        effect.is(addMark) &&
        isApplicableAddMarkEffect(effect, tr.state.doc)
      ) {
        return RangeSet.of(
          markDecoration.range(effect.value.from, effect.value.to)
        );
      }
    }
    return marks.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

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
    [appTheme.palette, appTheme.typography, props.font]
  );
  const textChangedExtension = useMemo(
    () => textChanged(props.onTextChanged),
    [props.onTextChanged]
  );
  const selectionExtension = useMemo(
    () => textSelection(props.onTextSelected),
    [props.onTextSelected]
  );
  const fileDroppedExtension = useMemo(
    () => fileDropped(props.onFileDropped),
    [props.onFileDropped]
  );

  useEffect(() => {
    if (
      !props.markedText ||
      props.markedText.to === props.markedText.from ||
      !view
    ) {
      return;
    }
    const effects: Array<StateEffect<unknown>> = [addMark.of(props.markedText)];

    view.dispatch({ effects });
  }, [props.markedText, view]);

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
        Lyrics(),
        syllableCounts(),
        history(),
        EditorView.lineWrapping,
        placeholder(sample(placeholders)),
        themeCompartment.of(themeExtension),
        textCompartment.of(textChangedExtension),
        selectionCompartment.of(selectionExtension),
        fileDroppedCompartment.of(fileDroppedExtension),
        markStateField,
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

  useEffect(
    () => () => {
      if (view) {
        view.destroy();
        setView(undefined);
      }
    },
    [view]
  );

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
      view.state.selection.main.empty &&
      view.state.selection.main.anchor !== props.cursorPosition
    ) {
      view.dispatch({
        selection: {
          anchor: props.cursorPosition,
        },
      });
    }
  }, [props.cursorPosition, view]);

  const reconfigurableExtensions = useMemo(
    () => [
      {
        compartment: themeCompartment,
        extension: themeExtension,
      },
      {
        compartment: textCompartment,
        extension: textChangedExtension,
      },
      {
        compartment: selectionCompartment,
        extension: selectionExtension,
      },
      {
        compartment: fileDroppedCompartment,
        extension: fileDroppedExtension,
      },
    ],
    [
      themeCompartment,
      themeExtension,
      textCompartment,
      textChangedExtension,
      selectionCompartment,
      selectionExtension,
      fileDroppedCompartment,
      fileDroppedExtension,
    ]
  );
  useReconfigurableExtension(view, reconfigurableExtensions);

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
