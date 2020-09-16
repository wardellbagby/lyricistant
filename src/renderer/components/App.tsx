import { CssBaseline } from '@material-ui/core';
import { Theme, ThemeProvider } from '@material-ui/core/styles';
import { PreferencesData } from 'common/preferences/PreferencesData';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { IRange } from 'monaco-editor/esm/vs/editor/editor.api';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import 'typeface-roboto';
import { Rhyme } from '../models/rhyme';
import {
  createLyricistantLanguage,
  createLyricistantTheme
} from '../util/monaco-helpers';
import { createTheme } from '../util/theme';
import { AppLayout } from './AppLayout';
import { Editor, TextReplacement, WordAtPosition } from './Editor';
import { Menu } from './Menu';
import { Preferences } from './Preferences';
import { Rhymes } from './Rhymes';

createLyricistantLanguage();

export interface AppProps {
  onShouldUpdateBackground: (newBackground: string) => void;
}

enum Screen {
  PREFERENCES,
  EDITOR
}

const defaultTheme = createTheme(null, true);
const selectedWords: Subject<WordAtPosition> = new Subject();
const textReplacements: Subject<TextReplacement> = new Subject();
const onWordSelected: (word: WordAtPosition) => void = (word) => {
  selectedWords.next(word);
};

const onRhymeClicked = (rhyme: Rhyme, range: IRange) =>
  textReplacements.next({ word: rhyme.word, range });

const onPreferencesSaved = (preferencesData: PreferencesData) =>
  platformDelegate.send('save-prefs', preferencesData);

const onPreferencesClosed = (): void => platformDelegate.send('save-prefs');

export const App: FunctionComponent<AppProps> = (props: AppProps) => {
  const [screen, setScreen] = useState(Screen.EDITOR);
  const [preferencesData, setPreferencesData] = useState(
    null as PreferencesData
  );
  const [theme, setTheme] = useState(defaultTheme);
  const [editorText, setEditorText] = useState('');

  useEffect(handleThemeChanges(setTheme, props.onShouldUpdateBackground), []);
  useEffect(handlePreferencesChanges(setPreferencesData), []);
  useEffect(handleFileChanges(), []);
  useEffect(handleScreenChanges(setScreen), []);
  useEffect(() => platformDelegate.send('ready-for-events'), []);

  return (
    <CssBaseline>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
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
        </SnackbarProvider>
      </ThemeProvider>
    </CssBaseline>
  );
};

function handleThemeChanges(
  setTheme: (theme: Theme) => void,
  onShouldUpdateBackground: (newBackground: string) => void
): () => void {
  return () => {
    const darkModeChangedListener = (
      textSize: number,
      useDarkTheme: boolean
    ) => {
      const appTheme = createTheme(textSize, useDarkTheme);
      setTheme(appTheme);
      monaco.editor.setTheme(createLyricistantTheme(useDarkTheme));
      onShouldUpdateBackground(appTheme.palette.background.default);
    };
    platformDelegate.on('dark-mode-toggled', darkModeChangedListener);

    return function cleanup() {
      platformDelegate.removeListener(
        'dark-mode-toggled',
        darkModeChangedListener
      );
    };
  };
}

function handleFileChanges(): () => void {
  const { enqueueSnackbar } = useSnackbar();
  return () => {
    const onFileOpened = (error: Error, fileName: string) => {
      if (error) {
        enqueueSnackbar("Couldn't open the selected file.", {
          variant: 'error'
        });
      } else {
        document.title = fileName;
      }
    };
    platformDelegate.on('file-opened', onFileOpened);

    const onNewFile = () => {
      document.title = 'Untitled';
    };
    platformDelegate.on('new-file-created', onNewFile);

    return function cleanup() {
      platformDelegate.removeListener('file-opened', onFileOpened);
      platformDelegate.removeListener('new-file-created', onNewFile);
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
