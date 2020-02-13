import {
  createMuiTheme,
  responsiveFontSizes,
  Theme,
  ThemeProvider
} from '@material-ui/core/styles';
import { getCssColor, getCssNumber } from 'common/css-helpers';
import { IpcChannels } from 'common/ipc-channels';
import {
  createLyricistantLanguage,
  createLyricistantTheme
} from 'common/monaco-helpers';
import { PreferencesData } from 'common/PreferencesData';
import { Rhyme } from 'common/Rhyme';
import { ipcRenderer } from 'electron';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Editor, TextReplacement, WordAtPosition } from './Editor';
import { Preferences } from './Preferences';
import { Rhymes } from './Rhymes';

createLyricistantLanguage();

const createTheme = (textSize: number | null, useDarkTheme: boolean): Theme => {
  return responsiveFontSizes(
    createMuiTheme({
      palette: {
        type: useDarkTheme ? 'dark' : 'light',
        action: {
          hover: getCssColor('--primary-color'),
          hoverOpacity: 0
        },
        primary: { main: getCssColor('--primary-color') },
        background: {
          default: getCssColor('--primary-background-color'),
          paper: getCssColor('--secondary-background-color')
        },
        text: {
          primary: getCssColor('--primary-text-color'),
          secondary: getCssColor('--secondary-text-color')
        }
      },
      typography: {
        fontSize: textSize || getCssNumber('--details-text-size')
      }
    })
  );
};

export interface AppProps {
  onShouldUpdateBackground: (newBackground: string) => void;
}

enum Screen {
  PREFERENCES,
  EDITOR
}

const selectedWords: Subject<WordAtPosition> = new Subject();
const textReplacements: Subject<TextReplacement> = new Subject();
const onWordSelected: (word: WordAtPosition) => void = (word) => {
  selectedWords.next(word);
};

const onRhymeClicked: (rhyme: Rhyme, range: monaco.IRange) => void = (
  rhyme,
  range
) => {
  textReplacements.next({ word: rhyme.word, range });
};

const onPreferencesSaved: (preferencesData: PreferencesData) => void = (
  preferencesData
) => {
  ipcRenderer.send(IpcChannels.SAVE_PREFERENCES, preferencesData);
};
const onPreferencesClosed: () => void = () =>
  ipcRenderer.send(IpcChannels.SAVE_PREFERENCES);

export const App: FunctionComponent<AppProps> = (props: AppProps) => {
  const [screen, setScreen] = useState(Screen.EDITOR);
  const [preferencesData, setPreferencesData] = useState(
    null as PreferencesData
  );
  const [theme, setTheme] = useState(createTheme(null, true));

  useEffect(handleThemeChanges(setTheme, props.onShouldUpdateBackground), []);
  useEffect(handlePreferencesChanges(setPreferencesData), []);
  useEffect(handleFileChanges(), []);
  useEffect(handleScreenChanges(setScreen), []);
  useEffect(() => ipcRenderer.send(IpcChannels.READY_FOR_EVENTS), []);

  return (
    <ThemeProvider theme={theme}>
      <Preferences
        show={screen === Screen.PREFERENCES}
        data={preferencesData}
        onPreferencesSaved={onPreferencesSaved}
        onClosed={onPreferencesClosed}
      />
      <Editor
        className={'editor'}
        fontSize={theme.typography.fontSize}
        onWordSelected={onWordSelected}
        textReplacements={textReplacements}
      />
      <Rhymes
        className={'detail-column'}
        queries={selectedWords}
        onRhymeClicked={onRhymeClicked}
      />
    </ThemeProvider>
  );
};

function handleThemeChanges(
  setTheme: (theme: Theme) => void,
  onShouldUpdateBackground: (newBackground: string) => void
): () => void {
  return () => {
    const darkModeChangedListener = (
      _: any,
      textSize: number,
      useDarkTheme: boolean
    ) => {
      if (useDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const appTheme = createTheme(textSize, useDarkTheme);
      setTheme(appTheme);
      monaco.editor.setTheme(createLyricistantTheme(useDarkTheme));
      onShouldUpdateBackground(appTheme.palette.background.default);
    };
    ipcRenderer.on(IpcChannels.THEME_CHANGED, darkModeChangedListener);

    return function cleanup() {
      ipcRenderer.removeListener(
        IpcChannels.THEME_CHANGED,
        darkModeChangedListener
      );
    };
  };
}

function handleFileChanges(): () => void {
  return () => {
    const onFileOpened = (_: any, error: any, fileName: string) => {
      if (error) {
        // todo show error message
      } else {
        document.title = fileName;
      }
    };
    ipcRenderer.on(IpcChannels.FILE_OPENED, onFileOpened);

    const onNewFile = () => {
      document.title = 'Untitled';
    };
    ipcRenderer.on(IpcChannels.NEW_FILE_CREATED, onNewFile);

    return function cleanup() {
      ipcRenderer.removeListener(IpcChannels.FILE_OPENED, onFileOpened);
      ipcRenderer.removeListener(IpcChannels.NEW_FILE_CREATED, onNewFile);
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
    ipcRenderer.on(IpcChannels.OPEN_PREFERENCES, openedPreferences);

    const closedPreferences = () => {
      setScreen(Screen.EDITOR);
    };
    ipcRenderer.on(IpcChannels.CLOSE_PREFERENCES, closedPreferences);

    return function cleanup() {
      ipcRenderer.removeListener(
        IpcChannels.OPEN_PREFERENCES,
        openedPreferences
      );
      ipcRenderer.removeListener(
        IpcChannels.CLOSE_PREFERENCES,
        closedPreferences
      );
    };
  };
}

function handlePreferencesChanges(
  setPreferences: (data: PreferencesData) => void
): () => void {
  return () => {
    const updatedPreferences = (_: any, data: PreferencesData) => {
      setPreferences(data);
    };
    ipcRenderer.on(IpcChannels.PREFERENCES_UPDATED, updatedPreferences);

    return function cleanup() {
      ipcRenderer.removeListener(
        IpcChannels.PREFERENCES_UPDATED,
        updatedPreferences
      );
    };
  };
}
