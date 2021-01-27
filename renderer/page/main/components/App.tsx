import { PreferencesData } from '@common/preferences/PreferencesData';
import { useTheme } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import 'typeface-roboto';
import { logger, platformDelegate } from '../globals';
import { useChannel } from '../hooks/useChannel';
import { downloadApp } from '../util/download-app';
import { SelectedWordStore } from '../stores/SelectedWordStore';
import { AboutDialog } from './AboutDialog';
import { AppError } from './AppError';
import { AppLayout } from './AppLayout';
import { ChooseDownloadDialog } from './ChooseDownloadDialog';
import { Editor } from './Editor';
import { Menu } from './Menu';
import { PlatformDialog } from './PlatformDialogs';
import { Preferences } from './Preferences';
import { Rhymes } from './Rhymes';

enum Screen {
  PREFERENCES,
  EDITOR,
  ABOUT,
}

const onPreferencesSaved = (preferencesData: PreferencesData) =>
  platformDelegate.send('save-prefs', preferencesData);

const onPreferencesClosed = (): void => platformDelegate.send('save-prefs');

export function App() {
  const [screen, setScreen] = useState(Screen.EDITOR);
  const history = useHistory();
  const [preferencesData, setPreferencesData] = useState(
    null as PreferencesData
  );
  const [editorText, setEditorText] = useState('');
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => logger.debug(`Displaying screen: ${screen}`), [screen]);
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
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <AppError error={error} editorText={editorText} />
      )}
    >
      <Switch>
        <Route path={'/download'}>
          <ChooseDownloadDialog show={true} onClose={() => history.goBack()} />
        </Route>
        <Route path={'/'}>
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
              onNewClicked={() => platformDelegate.send('new-file-attempt')}
              onOpenClicked={() => platformDelegate.send('open-file-attempt')}
              onSaveClicked={() =>
                platformDelegate.send('save-file-attempt', editorText)
              }
              onSettingsClicked={() => setScreen(Screen.PREFERENCES)}
              onDownloadClicked={() => {
                if (!downloadApp()) {
                  history.push('/download');
                }
              }}
            />
            <SelectedWordStore>
              <Editor
                text={editorText}
                fontSize={theme.typography.fontSize}
                onTextChanged={setEditorText}
              />
              <Rhymes
                onRhymeClicked={() => {
                  throw Error('Implement me!');
                }}
              />
            </SelectedWordStore>
          </AppLayout>
        </Route>
        <Route render={() => <Redirect to="/" />} />
      </Switch>
      <PlatformDialog />
    </ErrorBoundary>
  );
}
