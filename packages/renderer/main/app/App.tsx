import React, { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { Editor, EditorTextData } from '@lyricistant/renderer/editor/Editor';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { Rhymes } from '@lyricistant/renderer/rhymes/Rhymes';
import { goTo, Modals } from '@lyricistant/renderer/app/Modals';
import { useHistory } from 'react-router-dom';
import { AppError } from '@lyricistant/renderer/app/AppError';
import { ErrorBoundary } from 'react-error-boundary';
import { TextSelectionData } from '@lyricistant/codemirror/textSelection';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { ResponsiveMainDetailLayout } from './ResponsiveMainDetailLayout';

export function App() {
  const [editorTextData, setEditorTextData] = useState<EditorTextData>({
    text: '',
    isTransactional: false,
  });
  const [selectedText, setSelectedText] = useState<TextSelectionData>();
  const [isModified, setIsModified] = useState(false);
  const history = useHistory();

  const onSaveClicked = useCallback(
    () => platformDelegate.send('save-file-attempt', editorTextData.text),
    [editorTextData]
  );

  // TODO I don't think this is saving any re-renders?
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

  useEffect(() => {
    const onTextRequested = () => {
      platformDelegate.send('editor-text', editorTextData.text);
    };
    platformDelegate.on('request-editor-text', onTextRequested);
    return () => {
      platformDelegate.removeListener('request-editor-text', onTextRequested);
    };
  }, [editorTextData.text]);

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <AppError error={error} editorText={editorTextData.text} />
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
