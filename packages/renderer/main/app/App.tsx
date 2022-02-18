import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { SelectedWordStore } from '@lyricistant/renderer/editor/SelectedWordStore';
import { EditorTextStore } from '@lyricistant/renderer/editor/EditorTextStore';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { Editor } from '@lyricistant/renderer/editor/Editor';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { Rhymes } from '@lyricistant/renderer/rhymes/Rhymes';
import { AppLayout } from './AppLayout';

export function App() {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  useChannel('file-opened', (error) => {
    if (error) {
      enqueueSnackbar("Couldn't open selected file.", {
        variant: 'error',
      });
    }
  });
  useChannel('app-title-changed', (title) => (document.title = title));
  useChannel('open-about', () => history.push('/about'), [history]);
  useChannel('open-prefs', () => history.push('/preferences'), [history]);

  return (
    <EditorTextStore>
      <SelectedWordStore>
        <AppLayout menu={<Menu />} main={<Editor />} detail={<Rhymes />} />
      </SelectedWordStore>
    </EditorTextStore>
  );
}
