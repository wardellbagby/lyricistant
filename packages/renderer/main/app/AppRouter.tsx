import React, { useCallback, useEffect } from 'react';
import { Route, useHistory } from 'react-router-dom';
import { ChooseDownloadDialog } from '@lyricistant/renderer/download/ChooseDownloadDialog';
import { Preferences } from '@lyricistant/renderer/preferences/Preferences';
import { AboutDialog } from '@lyricistant/renderer/about/AboutDialog';
import { PrivacyPolicy } from '@lyricistant/renderer/privacy/PrivacyPolicy';
import { FileHistory } from '@lyricistant/renderer/filehistory/FileHistory';
import { RouteChildrenProps } from 'react-router';
import { PlatformDialog } from '@lyricistant/renderer/dialog/PlatformDialogs';
import { App } from './App';

export function AppRouter() {
  const history = useHistory();

  const goAbout = useCallback(() => history.push('/about'), [history]);
  const goBack = useCallback(() => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.replace('/');
    }
  }, [history]);

  useEffect(() => {
    logger.verbose('Navigation', location.pathname);
  }, [location]);

  return (
    <>
      <App />
      <Route
        path="/download"
        children={({ match }: RouteChildrenProps) => (
          <ChooseDownloadDialog open={!!match} onClose={goBack} />
        )}
      />
      <Route
        path="/about"
        children={({ match }: RouteChildrenProps) => (
          <AboutDialog open={!!match} onClose={goBack} />
        )}
      />
      <Route
        path="/privacypolicy"
        children={({ match }: RouteChildrenProps) => (
          <PrivacyPolicy open={!!match} onClose={goBack} />
        )}
      />
      <Route
        path="/file-history"
        children={({ match }: RouteChildrenProps) => (
          <FileHistory open={!!match} onClose={goBack} />
        )}
      />
      <Route
        path="/preferences"
        children={({ match }: RouteChildrenProps) => (
          <Preferences
            open={!!match}
            onClose={goBack}
            onAboutClicked={goAbout}
          />
        )}
      />
      <PlatformDialog />
    </>
  );
}
