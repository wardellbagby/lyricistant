import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { SelectedWordStore } from '@lyricistant/renderer/editor/SelectedWordStore';
import { EditorTextStore } from '@lyricistant/renderer/editor/EditorTextStore';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { PreferencesStore } from '@lyricistant/renderer/preferences/PreferencesStore';
import { Editor } from '@lyricistant/renderer/editor/Editor';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { Rhymes } from '@lyricistant/renderer/rhymes/Rhymes';
import { AppLayout } from './AppLayout';

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
