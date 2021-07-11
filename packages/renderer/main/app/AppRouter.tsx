import React, { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { logger } from "@lyricistant/renderer/globals";
import { ChooseDownloadDialog } from "@lyricistant/renderer/download/ChooseDownloadDialog";
import { PlatformDialog } from "@lyricistant/renderer/dialog/PlatformDialogs";
import { Preferences } from "@lyricistant/renderer/preferences/Preferences";
import { AboutDialog } from "@lyricistant/renderer/about/AboutDialog";
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
        <Route render={() => <Redirect to="/" />} />
      </Switch>

      <PlatformDialog />
    </>
  );
}
