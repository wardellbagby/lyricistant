import { useTheme } from '@material-ui/core/styles';
import { PreferencesData } from 'common/preferences/PreferencesData';
import { useSnackbar } from 'notistack';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import 'typeface-roboto';
import { Rhyme } from '../models/rhyme';
import { downloadApp } from '../util/download-app';
import { EmptyRange } from '../util/editor-helpers';
import { AppLayout } from './AppLayout';
import { ChooseDownloadDialog } from './ChooseDownload';
import { Editor, TextReplacement, WordAtPosition } from './Editor';
import { Menu } from './Menu';
import { Preferences } from './Preferences';
import { Rhymes } from './Rhymes';

enum Screen {
  PREFERENCES,
  EDITOR,
  DOWNLOAD,
}

const selectedWords: BehaviorSubject<WordAtPosition> = new BehaviorSubject({
  range: EmptyRange,
  word: '',
});
const textReplacements: Subject<TextReplacement> = new Subject();
const onWordSelected: (word: WordAtPosition) => void = (word) => {
  selectedWords.next(word);
};

const onRhymeClicked = (rhyme: Rhyme, range: any) =>
  textReplacements.next({ word: rhyme.word, range });

const onPreferencesSaved = (preferencesData: PreferencesData) =>
  platformDelegate.send('save-prefs', preferencesData);

const onPreferencesClosed = (): void => platformDelegate.send('save-prefs');

export const App: FunctionComponent = () => {
  const [screen, setScreen] = useState(Screen.EDITOR);
  const [preferencesData, setPreferencesData] = useState(
    null as PreferencesData
  );
  const [editorText, setEditorText] = useState('');
  const theme = useTheme();

  useEffect(handlePreferencesChanges(setPreferencesData), []);
  useEffect(handleFileChanges(), []);
  useEffect(handleScreenChanges(setScreen), []);

  return (
    <>
      <ChooseDownloadDialog
        show={screen === Screen.DOWNLOAD}
        onClose={() => setScreen(Screen.EDITOR)}
      />
      <Preferences
        show={screen === Screen.PREFERENCES}
        data={preferencesData}
        onPreferencesSaved={onPreferencesSaved}
        onClosed={onPreferencesClosed}
      />
      <AppLayout>
        <Menu
          onNewClicked={() => {
            platformDelegate.send('new-file-attempt');
          }}
          onOpenClicked={() => {
            platformDelegate.send('open-file-attempt');
          }}
          onSaveClicked={() => {
            platformDelegate.send('save-file-attempt', editorText);
          }}
          onSettingsClicked={() => {
            setScreen(Screen.PREFERENCES);
          }}
          onDownloadClicked={() => {
            if (!downloadApp()) {
              setScreen(Screen.DOWNLOAD);
            }
          }}
        />
        <Editor
          text={editorText}
          fontSize={theme.typography.fontSize}
          onWordSelected={onWordSelected}
          onTextChanged={setEditorText}
          textReplacements={textReplacements}
        />
        <Rhymes queries={selectedWords} onRhymeClicked={onRhymeClicked} />
      </AppLayout>
    </>
  );
};

function handleFileChanges(): () => void {
  const { enqueueSnackbar } = useSnackbar();
  return () => {
    const onFileOpened = (error: Error, filename: string) => {
      if (error) {
        enqueueSnackbar(`Couldn't open ${filename}`, {
          variant: 'error',
        });
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onTitleChanged = (title: string) => {
      document.title = title;
    };
    platformDelegate.on('app-title-changed', onTitleChanged);

    return () => {
      platformDelegate.removeListener('file-opened', onFileOpened);
      platformDelegate.removeListener('app-title-changed', onTitleChanged);
    };
  };
}

function handleScreenChanges(
  setScreen: (newScreen: Screen) => void
): () => void {
  return () => {
    const openedPreferences = () => {
      setScreen(Screen.PREFERENCES);
    };
    platformDelegate.on('open-prefs', openedPreferences);

    const closedPreferences = () => {
      setScreen(Screen.EDITOR);
    };
    platformDelegate.on('close-prefs', closedPreferences);

    return function cleanup() {
      platformDelegate.removeListener('open-prefs', openedPreferences);
      platformDelegate.removeListener('close-prefs', closedPreferences);
    };
  };
}

function handlePreferencesChanges(
  setPreferences: (data: PreferencesData) => void
): () => void {
  return () => {
    const updatedPreferences = (data: PreferencesData) => {
      setPreferences(data);
    };
    platformDelegate.on('prefs-updated', updatedPreferences);

    return function cleanup() {
      platformDelegate.removeListener('prefs-updated', updatedPreferences);
    };
  };
}
