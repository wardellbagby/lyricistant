import { Text } from '@lyricistant/codemirror/CodeMirror';
import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { AppError } from '@lyricistant/renderer/app/AppError';
import { Modals } from '@lyricistant/renderer/app/Modals';
import { useNavigation } from '@lyricistant/renderer/app/Navigation';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { DetailPane } from '@lyricistant/renderer/detail/DetailPane';
import { DiagnosticActionPopover } from '@lyricistant/renderer/diagnostics/Diagnostics';
import { Diagnostic } from '@lyricistant/renderer/diagnostics/DiagnosticsMachine';
import {
  Editor,
  EditorTextData,
  SelectableDiagnostic,
} from '@lyricistant/renderer/editor/Editor';
import {
  getRootError,
  isReportableError,
} from '@lyricistant/renderer/errors/ErrorHandlers';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import {
  useChannel,
  useChannelData,
} from '@lyricistant/renderer/platform/useChannel';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { useEventCallback } from '@mui/material';
import { sample, startCase } from 'lodash-es';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ResponsiveMainDetailLayout } from './ResponsiveMainDetailLayout';
import { ReadOnlyModeContext } from './useReadOnlyMode';
import { useBeforeUnload } from '@lyricistant/renderer/app/useBeforeUnload';

const MINIMUM_IDLE_TIME = 15_000;

/**
 * The Lyricistant app.
 *
 * Any component that renders any UI directly related to the core functionality
 * of Lyricistant must be a child of this component, either directly or
 * indirectly. Components that don't render UI, such as a Router or a
 * ThemeProvider, are allowed to be a parent of this component. Components that
 * potentially gate Lyricistant's ability to run, such as a component that
 * checks whether we're running on a supported browser, would also be allowed to
 * be a parent of this component.
 */
export function App() {
  const [editorTextData, setEditorTextData] = useState<EditorTextData>({
    text: Text.empty,
    isTransactional: false,
  });
  const [error, setError] = useState<unknown>(null);
  const [selectedText, setSelectedText] = useState<TextSelectionData>();
  const [isModified, setIsModified] = useState(false);
  const navigate = useNavigation();
  const [uiConfig] = useChannelData('ui-config');
  const [showQuerySelection, setShowQuerySelection] = useState(true);
  const [diagnostics, onDiagnosticsLoaded] = useState([]);
  const [selectedDiagnostic, setSelectedDiagnostic] =
    useState<SelectableDiagnostic>(null);
  const [selectedDiagnosticRect, setSelectedDiagnosticRect] =
    useState<DOMRect>(null);
  const [selectedDiagnosticKey, incrementKey] = useReducer(
    (value) => value + 1,
    0,
  );
  const [isReadOnly, setReadOnly] = useState(false);

  useEffect(() => {
    setSelectedDiagnostic(null);
  }, [diagnostics]);

  const onSaveClicked = useCallback(
    () =>
      platformDelegate.send(
        'save-file-attempt',
        editorTextData.text.toString(),
      ),
    [editorTextData.text],
  );

  const onPartialEditorTextDataUpdate = useCallback(
    (data: Partial<EditorTextData>) => {
      setEditorTextData((textData) => ({ ...textData, ...data }));
    },
    [setEditorTextData],
  );
  const onTextReplacement = useEventCallback((text: string) => {
    if (isReadOnly) {
      return;
    }

    const prefix = editorTextData.text.sliceString(0, selectedText.from);
    const suffix = editorTextData.text.sliceString(selectedText.to);

    setEditorTextData({
      text: Text.of((prefix + text + suffix).split('\n')),
      isTransactional: true,
      cursorPosition: selectedText.from + text.length,
    });
    setSelectedText({
      text,
      from: selectedText.from,
      to: selectedText.from + text.length,
    });
  });

  const onTextSelected = useEventCallback((value: TextSelectionData) => {
    if (value && value.text) {
      setSelectedText(value);
    }
  });

  useChannel('app-title-changed', (title) => (document.title = title));

  useFileEvents(isModified, onPartialEditorTextDataUpdate, () =>
    setSelectedText({ from: 0, to: 0, text: '' }),
  );
  useBeforeUnload(() => {
    if (uiConfig?.promptOnUrlChange && isModified) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });

  useEffect(() => {
    const onTextRequested = () => {
      platformDelegate.send('editor-text', editorTextData.text.toString());
    };
    platformDelegate.on('request-editor-text', onTextRequested);
    return () => {
      platformDelegate.removeListener('request-editor-text', onTextRequested);
    };
  }, [editorTextData.text]);

  useEffect(() => {
    window.onerror = (message, url, col, line, newError) => {
      const rootError = getRootError(newError ?? message);
      if (isReportableError(rootError, url)) {
        setError(rootError);
      }
    };
    window.onunhandledrejection = window.onerror;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      platformDelegate.send('editor-idle', editorTextData.text.toString());
    }, MINIMUM_IDLE_TIME);
    return () => clearTimeout(timer);
  }, [editorTextData]);

  const isSmallLayout = useSmallLayout();
  useEffect(() => {
    platformDelegate.send('layout-changed', isSmallLayout);
  }, [isSmallLayout]);

  const fallbackErrorRendering = useCallback(
    (props: FallbackProps) => (
      <AppError
        error={getRootError(props.error)}
        editorText={editorTextData.text.toString()}
      />
    ),
    [editorTextData.text],
  );

  const onDownloadClicked = useEventCallback(() => navigate('/download'));
  const onFileHistoryClicked = useEventCallback(() =>
    navigate('/file-history'),
  );
  const onPreferencesClicked = useEventCallback(() => navigate('/preferences'));
  const onNewClicked = useEventCallback(() =>
    platformDelegate.send('new-file-attempt'),
  );
  const onOpenClicked = useEventCallback(() =>
    platformDelegate.send('open-file-attempt'),
  );
  const onRhymeClicked = useEventCallback((rhyme: Rhyme) =>
    onTextReplacement(rhyme.word),
  );

  const { onInspirationButtonClicked, isInspirationButtonEnabled } =
    useInspirationButton(
      editorTextData,
      isReadOnly,
      setEditorTextData,
      setSelectedText,
    );

  const { onProposalAccepted } = useProposalAcceptance(
    editorTextData,
    isReadOnly,
    setEditorTextData,
    setSelectedText,
  );

  if (error) {
    return (
      <AppError error={error} editorText={editorTextData.text.toString()} />
    );
  }

  return (
    <ErrorBoundary fallbackRender={fallbackErrorRendering}>
      <ReadOnlyModeContext.Provider value={isReadOnly}>
        <ResponsiveMainDetailLayout
          menu={
            <Menu
              onReadOnlyToggled={setReadOnly}
              onDownloadClicked={onDownloadClicked}
              onFileHistoryClicked={onFileHistoryClicked}
              onPreferencesClicked={onPreferencesClicked}
              onNewClicked={onNewClicked}
              onOpenClicked={onOpenClicked}
              onSaveClicked={onSaveClicked}
            />
          }
          main={
            <Editor
              value={editorTextData}
              selectedText={showQuerySelection ? selectedText : null}
              diagnostics={diagnostics}
              selectedDiagnostic={selectedDiagnostic}
              onSelectedDiagnosticRendered={setSelectedDiagnosticRect}
              onTextChanged={setEditorTextData}
              onTextSelected={onTextSelected}
              onModificationStateChanged={setIsModified}
            />
          }
          detail={
            <DetailPane
              buttons={[]}
              onTabChanged={(data) => {
                setShowQuerySelection(data.isQueryTab);
              }}
              rhymeProps={{
                onRhymeClicked,
                query: selectedText?.text,
                isSurpriseButtonEnabled: isInspirationButtonEnabled,
                onSurpriseMeClicked: onInspirationButtonClicked,
              }}
              dictionaryProps={{
                onRelatedTextClicked: onTextReplacement,
                query: selectedText?.text,
              }}
              diagnosticsProps={{
                text: editorTextData.text,
                onDiagnosticsLoaded,
                onProposalAccepted,
                onDiagnosticClicked: (diagnostic) => {
                  setSelectedDiagnostic({
                    ...diagnostic,
                    key: selectedDiagnosticKey,
                  });
                  incrementKey();
                },
              }}
              onDisableReadonlyMode={() => setReadOnly(false)}
            />
          }
        />
        <Modals />
        <DiagnosticActionPopover
          diagnostic={selectedDiagnostic}
          domRect={selectedDiagnosticRect}
          onProposalAccepted={onProposalAccepted}
          onClose={() => {
            setSelectedDiagnostic(null);
            setSelectedDiagnosticRect(null);
          }}
        />
      </ReadOnlyModeContext.Provider>
    </ErrorBoundary>
  );
}

const useProposalAcceptance = (
  editorTextData: EditorTextData,
  isReadOnly: boolean,
  setEditorTextData: (data: EditorTextData) => void,
  setSelectedText: (data: TextSelectionData) => void,
) => {
  const onProposalAccepted = useEventCallback(
    (proposal: string, diagnostic: Diagnostic) => {
      if (isReadOnly) {
        return;
      }

      setEditorTextData({
        ...editorTextData,
        text: editorTextData.text.replace(
          diagnostic.from,
          diagnostic.to,
          Text.of([proposal]),
        ),
      });
      setSelectedText({
        text: proposal,
        from: diagnostic.from,
        to: diagnostic.from + proposal.length,
      });
    },
  );

  return {
    onProposalAccepted,
  };
};

const useInspirationWords = () => {
  const [inspirationWords, setInspirationWords] = useState<string[]>(null);
  useEffect(() => {
    if (!inspirationWords) {
      import('./inspiration_words.json').then((words) => {
        setInspirationWords(words);
      });
    }
  }, []);
  return inspirationWords;
};

const useInspirationButton = (
  editorTextData: EditorTextData,
  isReadOnly: boolean,
  setEditorTextData: (data: EditorTextData) => void,
  setSelectedText: (data: TextSelectionData) => void,
) => {
  const inspirationWords = useInspirationWords();
  const onInspirationButtonClicked = useEventCallback(() => {
    if (isReadOnly) {
      return;
    }

    const position = editorTextData.cursorPosition ?? 0;
    const prefix = editorTextData.text.sliceString(0, position);
    const suffix = editorTextData.text.sliceString(position);

    const word = sample(inspirationWords);
    const line = editorTextData.text.lineAt(position);
    let newText = word;
    let newPosition = position + word.length;
    const isStartOfLine = position === line.from;
    const isEndOfLine = position === line.to;

    if (isStartOfLine) {
      newText = startCase(newText);
    }

    const isPreviousCharacterSpace =
      !isStartOfLine &&
      position > 0 &&
      editorTextData.text
        .slice(position - 1, position)
        .toString()
        .match(/\s/);
    const isNextCharacterSpace =
      !isEndOfLine &&
      position < editorTextData.text.length &&
      editorTextData.text
        .slice(position, position + 1)
        .toString()
        .match(/\s/);

    if (prefix && !isStartOfLine && !isPreviousCharacterSpace) {
      newText = ' ' + newText;
      newPosition += 1;
    }
    if (suffix && !isEndOfLine && !isNextCharacterSpace) {
      newText = newText + ' ';
    }

    setEditorTextData({
      text: Text.of((prefix + newText + suffix).split('\n')),
      isTransactional: true,
      cursorPosition: newPosition,
    });
    setSelectedText({
      text: word,
      from: newPosition - word.length,
      to: newPosition,
    });
  });

  return {
    onInspirationButtonClicked,
    isInspirationButtonEnabled: !isReadOnly && !!inspirationWords,
  };
};

const useFileEvents = (
  isModified: boolean,
  setEditorText: (text: Partial<EditorTextData>) => void,
  resetTextSelection: () => void,
) => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const onCheckFileModified = () => {
      platformDelegate.send('is-file-modified', isModified);
    };
    platformDelegate.on('check-file-modified', onCheckFileModified);

    const onFileSaveEnded = (_: never, path: string) => {
      setEditorText({ isTransactional: false });

      if (path) {
        enqueueSnackbar(`${path} saved`, { variant: 'success' });
      }
    };
    platformDelegate.on('file-save-ended', onFileSaveEnded);

    const onNewFileCreated = () => {
      resetTextSelection();
      setEditorText({ text: Text.empty, isTransactional: false });
    };
    platformDelegate.on('new-file-created', onNewFileCreated);

    const onFileOpened = (
      error: Error,
      fileContents: string,
      clearHistory: boolean,
    ) => {
      if (error) {
        enqueueSnackbar("Couldn't open selected file.", {
          variant: 'error',
        });
      } else {
        resetTextSelection();
        setEditorText({
          text: Text.of(fileContents.split('\n')),
          isTransactional: !clearHistory,
        });
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    return () => {
      platformDelegate.removeListener(
        'check-file-modified',
        onCheckFileModified,
      );
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
      platformDelegate.removeListener('new-file-created', onNewFileCreated);
      platformDelegate.removeListener('file-opened', onFileOpened);
    };
  }, [isModified, setEditorText]);
};
