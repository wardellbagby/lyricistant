import React, { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { SelectedWordStore } from '@lyricistant/renderer/editor/SelectedWordStore';
import { useEditorText } from '@lyricistant/renderer/editor/EditorTextStore';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { Editor } from '@lyricistant/renderer/editor/Editor';
import { Menu } from '@lyricistant/renderer/menu/Menu';
import { Rhymes } from '@lyricistant/renderer/rhymes/Rhymes';
import { goTo, Modals } from '@lyricistant/renderer/app/Modals';
import { useHistory } from 'react-router-dom';
import { ResponsiveMainDetailLayout } from './ResponsiveMainDetailLayout';

export function App() {
  const { enqueueSnackbar } = useSnackbar();
  const editorText = useEditorText();
  const history = useHistory();

  const onSaveClicked = useCallback(
    () => platformDelegate.send('save-file-attempt', editorText),
    [editorText]
  );

  useChannel('file-opened', (error) => {
    if (error) {
      enqueueSnackbar("Couldn't open selected file.", {
        variant: 'error',
      });
    }
  });
  useChannel('app-title-changed', (title) => (document.title = title));

  return (
    <SelectedWordStore>
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
        main={<Editor />}
        detail={<Rhymes />}
      />
      <Modals />
    </SelectedWordStore>
  );
}
