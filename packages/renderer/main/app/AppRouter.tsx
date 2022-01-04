import React, { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { ChooseDownloadDialog } from '@lyricistant/renderer/download/ChooseDownloadDialog';
import { PlatformDialog } from '@lyricistant/renderer/dialog/PlatformDialogs';
import { Preferences } from '@lyricistant/renderer/preferences/Preferences';
import { AboutDialog } from '@lyricistant/renderer/about/AboutDialog';
import { PrivacyPolicy } from '@lyricistant/renderer/privacy/PrivacyPolicy';
import { App } from './App';

export function AppRouter() {
  const location = useLocation();

  useEffect(() => {
    logger.verbose('Navigation', location.pathname);
  }, [location]);

  return (
    <>
      <App />
      <Switch>
        <Route path="/download" component={ChooseDownloadDialog} />
        <Route path="/preferences" component={Preferences} />
        <Route path="/about" component={AboutDialog} />
        <Route path="/privacypolicy" component={PrivacyPolicy} />
        <Route render={() => <Redirect to="/" />} />
      </Switch>

      <PlatformDialog />
    </>
  );
}
