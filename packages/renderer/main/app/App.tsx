import { Text } from '@lyricistant/codemirror/CodeMirror';
import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { AppError } from '@lyricistant/renderer/app/AppError';
import { Modals } from '@lyricistant/renderer/app/Modals';
import { useNavigation } from '@lyricistant/renderer/app/Navigation';
import { DetailPane } from '@lyricistant/renderer/detail/DetailPane';
import { Editor, EditorTextData } from '@lyricistant/renderer/editor/Editor';
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
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ResponsiveMainDetailLayout } from './ResponsiveMainDetailLayout';

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
  const [error, setError] = useState<any>(null);
  const [selectedText, setSelectedText] = useState<TextSelectionData>();
  const [isModified, setIsModified] = useState(false);
  const navigate = useNavigation();
  const [uiConfig] = useChannelData('ui-config');

  const onSaveClicked = useCallback(
    () =>
      platformDelegate.send(
        'save-file-attempt',
        editorTextData.text.toString()
      ),
    [editorTextData.text]
  );

  const onPartialEditorTextDataUpdate = useCallback(
    (data: Partial<EditorTextData>) => {
      setEditorTextData((textData) => ({ ...textData, ...data }));
    },
    [setEditorTextData]
  );
  const onTextReplacement = useEventCallback((text: string) => {
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
    setSelectedText({ from: 0, to: 0, text: '' })
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

  const fallbackErrorRendering = useCallback(
    (props: FallbackProps) => (
      <AppError
        error={getRootError(props.error)}
        editorText={editorTextData.text.toString()}
      />
    ),
    [editorTextData.text]
  );

  const onDownloadClicked = useEventCallback(() => navigate('/download'));
  const onFileHistoryClicked = useEventCallback(() =>
    navigate('/file-history')
  );
  const onPreferencesClicked = useEventCallback(() => navigate('/preferences'));
  const onNewClicked = useEventCallback(() =>
    platformDelegate.send('new-file-attempt')
  );
  const onOpenClicked = useEventCallback(() =>
    platformDelegate.send('open-file-attempt')
  );
  const onRhymeClicked = useEventCallback((rhyme: Rhyme) =>
    onTextReplacement(rhyme.word)
  );

  if (error) {
    return (
      <AppError error={error} editorText={editorTextData.text.toString()} />
    );
  }

  return (
    <ErrorBoundary fallbackRender={fallbackErrorRendering}>
      <ResponsiveMainDetailLayout
        menu={
          <Menu
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
            onTextChanged={setEditorTextData}
            onTextSelected={onTextSelected}
            onModificationStateChanged={setIsModified}
          />
        }
        detail={
          <DetailPane
            rhymeProps={{
              onRhymeClicked,
              query: selectedText?.text,
            }}
            dictionaryProps={{
              onRelatedTextClicked: onTextReplacement,
              query: selectedText?.text,
            }}
          />
        }
      />
      <Modals />
    </ErrorBoundary>
  );
}

const useFileEvents = (
  isModified: boolean,
  setEditorText: (text: Partial<EditorTextData>) => void,
  resetTextSelection: () => void
) => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const onCheckFileModified = () => {
      platformDelegate.send('is-file-modified', isModified);
    };
    platformDelegate.on('check-file-modified', onCheckFileModified);

    const onFileSaveEnded = (error: any, path: string) => {
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
      clearHistory: boolean
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
        onCheckFileModified
      );
      platformDelegate.removeListener('file-save-ended', onFileSaveEnded);
      platformDelegate.removeListener('new-file-created', onNewFileCreated);
      platformDelegate.removeListener('file-opened', onFileOpened);
    };
  }, [isModified, setEditorText]);
};
