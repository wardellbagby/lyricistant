import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { AppError } from '@lyricistant/renderer/app/AppError';
import { goTo, Modals } from '@lyricistant/renderer/app/Modals';
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
import { Rhymes } from '@lyricistant/renderer/rhymes/Rhymes';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useBeforeunload as useBeforeUnload } from 'react-beforeunload';
import { ErrorBoundary } from 'react-error-boundary';
import { useHistory } from 'react-router-dom';
import { ResponsiveMainDetailLayout } from './ResponsiveMainDetailLayout';

/**
 * The Lyricistant app.
 *
 * Any component that renders any UI directly related to the core functionality
 * of Lyricistant must be a child of this component, either directly or
 * indirectly. Components that don't render UI, such as a Router or a
 * ThemeProvider, are allowed to be a parent of this component. Components that
 * potentially gate Lyricistant's ability to run, such as a component that checks
 * whether we're running on a supported browser, would also be allowed to be a
 * parent of this component.
 */
export function App() {
  const [editorTextData, setEditorTextData] = useState<EditorTextData>({
    text: '',
    isTransactional: false,
  });
  const [error, setError] = useState<any>(null);
  const [selectedText, setSelectedText] = useState<TextSelectionData>();
  const [isModified, setIsModified] = useState(false);
  const history = useHistory();
  const [uiConfig] = useChannelData('ui-config');

  const onSaveClicked = useCallback(
    () => platformDelegate.send('save-file-attempt', editorTextData.text),
    [editorTextData]
  );

  // TODO Migrate this to useEvent whenever that lands
  //  https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
  const onPartialEditorTextDataUpdate = useCallback(
    (data: Partial<EditorTextData>) => {
      setEditorTextData({ ...editorTextData, ...data });
    },
    [editorTextData]
  );
  const onRhymeClicked = useCallback(
    (rhyme: Rhyme) => {
      const prefix = editorTextData.text.substring(0, selectedText.from);
      const suffix = editorTextData.text.substring(selectedText.to);

      setEditorTextData({
        text: prefix + rhyme.word + suffix,
        isTransactional: true,
      });
      setSelectedText({
        text: rhyme.word,
        from: selectedText.from,
        to: selectedText.from + rhyme.word.length,
      });
    },
    [selectedText, editorTextData]
  );

  useChannel('app-title-changed', (title) => (document.title = title));

  useFileEvents(isModified, onPartialEditorTextDataUpdate);
  useBeforeUnload(() => {
    if (uiConfig?.promptOnUrlChange && isModified) {
      return "Are you sure you want to leave? Your changes haven't been saved.";
    }
  });

  useEffect(() => {
    const onTextRequested = () => {
      platformDelegate.send('editor-text', editorTextData.text);
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

  if (error) {
    return <AppError error={error} editorText={editorTextData.text} />;
  }

  return (
    <ErrorBoundary
      fallbackRender={(props) => (
        <AppError
          error={getRootError(props.error)}
          editorText={editorTextData.text}
        />
      )}
    >
      <ResponsiveMainDetailLayout
        menu={
          <Menu
            onDownloadClicked={() => goTo(history, 'download')}
            onFileHistoryClicked={() => goTo(history, 'file-history')}
            onPreferencesClicked={() => goTo(history, 'preferences')}
            onNewClicked={() => platformDelegate.send('new-file-attempt')}
            onOpenClicked={() => platformDelegate.send('open-file-attempt')}
            onSaveClicked={onSaveClicked}
          />
        }
        main={
          <Editor
            value={editorTextData}
            onTextChanged={setEditorTextData}
            onTextSelected={(value) => {
              if (value && value.text) {
                setSelectedText(value);
              }
            }}
            onModificationStateChanged={setIsModified}
          />
        }
        detail={
          <Rhymes query={selectedText?.text} onRhymeClicked={onRhymeClicked} />
        }
      />
      <Modals />
    </ErrorBoundary>
  );
}

const useFileEvents = (
  isModified: boolean,
  setEditorText: (text: Partial<EditorTextData>) => void
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
      setEditorText({ text: '', isTransactional: false });
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
        setEditorText({
          text: fileContents,
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
