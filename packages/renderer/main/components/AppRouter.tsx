import React, { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { logger } from '../globals';
import { App } from './App';
import { ChooseDownloadDialog } from './ChooseDownloadDialog';
import { PlatformDialog } from './PlatformDialogs';
import { Preferences } from './Preferences';
import { AboutDialog } from './AboutDialog';

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
