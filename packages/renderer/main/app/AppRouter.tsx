import React, { useCallback, useEffect } from 'react';
import { Redirect, Route, useHistory } from 'react-router-dom';
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

  const goHome = useCallback(() => history.replace('/'), [history]);
  const goAbout = useCallback(() => history.replace('/about'), [history]);

  useEffect(() => {
    logger.verbose('Navigation', location.pathname);
  }, [location]);

  return (
    <>
      <App />
      <Route
        path="/download"
        children={({ match }: RouteChildrenProps) => (
          <ChooseDownloadDialog open={!!match} onClose={goHome} />
        )}
      />
      <Route
        path="/about"
        children={({ match }: RouteChildrenProps) => (
          <AboutDialog open={!!match} onClose={goHome} />
        )}
      />
      <Route
        path="/privacypolicy"
        children={({ match }: RouteChildrenProps) => (
          <PrivacyPolicy open={!!match} onClose={goHome} />
        )}
      />
      <Route
        path="/file-history"
        children={({ match }: RouteChildrenProps) => (
          <FileHistory open={!!match} onClose={goHome} />
        )}
      />
      <Route
        path="/preferences"
        children={({ match }: RouteChildrenProps) => (
          <Preferences
            open={!!match}
            onClose={goHome}
            onAboutClicked={goAbout}
          />
        )}
      />
      <Route render={() => <Redirect to="/" />} />
      <PlatformDialog />
    </>
  );
}
