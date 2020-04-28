import {
  createMuiTheme,
  responsiveFontSizes,
  Theme,
  ThemeProvider
} from '@material-ui/core/styles';
import { getCssColor, getCssNumber } from 'common/css-helpers';
import {
  createLyricistantLanguage,
  createLyricistantTheme
} from 'common/monaco-helpers';
import { PreferencesData } from 'common/PreferencesData';
import { Rhyme } from 'common/Rhyme';
import { platformDelegate } from 'Delegate';
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
  platformDelegate.send('save-prefs', preferencesData);
};
const onPreferencesClosed: () => void = () =>
  platformDelegate.send('save-prefs');

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
  useEffect(() => platformDelegate.send('ready-for-events'), []);

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
  return () => {
    const onFileOpened = (error: Error, fileName: string) => {
      if (error) {
        // todo show error message
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
