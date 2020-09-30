import { useTheme } from '@material-ui/core/styles';
import { PreferencesData } from 'common/preferences/PreferencesData';
import { useSnackbar } from 'notistack';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import 'typeface-roboto';
import { useChannel } from '../hooks/useChannel';
import { Rhyme } from '../models/rhyme';
import { downloadApp } from '../util/download-app';
import { EmptyRange } from '../util/editor-helpers';
import { AboutDialog } from './AboutDialog';
import { AppLayout } from './AppLayout';
import { ChooseDownloadDialog } from './ChooseDownloadDialog';
import { Editor, TextReplacement, WordAtPosition } from './Editor';
import { Menu } from './Menu';
import { Preferences } from './Preferences';
import { Rhymes } from './Rhymes';

enum Screen {
  PREFERENCES,
  EDITOR,
  DOWNLOAD,
  ABOUT,
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
  const { enqueueSnackbar } = useSnackbar();

  useChannel('prefs-updated', setPreferencesData);
  useChannel('file-opened', (error, filename) => {
    if (error) {
      enqueueSnackbar(`Couldn't open ${filename ?? 'selected file.'}`, {
        variant: 'error',
      });
    }
  });
  useChannel('app-title-changed', (title) => (document.title = title));
  useChannel('open-prefs', () => setScreen(Screen.PREFERENCES));
  useChannel('close-prefs', () => setScreen(Screen.EDITOR));
  useChannel('open-about', () => setScreen(Screen.ABOUT));

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
        onAboutClicked={() => setScreen(Screen.ABOUT)}
      />
      <AboutDialog
        show={screen === Screen.ABOUT}
        onClose={() => setScreen(Screen.EDITOR)}
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
