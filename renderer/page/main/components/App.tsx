import React from 'react';
import { useHistory } from 'react-router-dom';
import 'typeface-roboto';
import { useSnackbar } from 'notistack';
import { SelectedWordStore } from '../stores/SelectedWordStore';
import { EditorTextStore } from '../stores/EditorTextStore';
import { useChannel } from '../hooks/useChannel';
import { PreferencesStore } from '../stores/PreferencesStore';
import { AppLayout } from './AppLayout';
import { Editor } from './Editor';
import { Menu } from './Menu';
import { Rhymes } from './Rhymes';

export function App() {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  useChannel('file-opened', (error, filename) => {
    if (error) {
      enqueueSnackbar(`Couldn't open ${filename ?? 'selected file.'}`, {
        variant: 'error',
      });
    }
  });
  useChannel('app-title-changed', (title) => (document.title = title));
  useChannel('close-prefs', () => history.replace('/'));
  useChannel('open-about', () => history.replace('/about'));

  return (
    <EditorTextStore>
      <PreferencesStore>
        <SelectedWordStore>
          <AppLayout menu={<Menu />} main={<Editor />} detail={<Rhymes />} />
        </SelectedWordStore>
      </PreferencesStore>
    </EditorTextStore>
  );
}
