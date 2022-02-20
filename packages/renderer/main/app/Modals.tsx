import React, { useCallback, useEffect, ReactNode } from 'react';
import { Route, useHistory } from 'react-router-dom';
import { ChooseDownloadDialog } from '@lyricistant/renderer/download/ChooseDownloadDialog';
import { Preferences } from '@lyricistant/renderer/preferences/Preferences';
import { AboutDialog } from '@lyricistant/renderer/about/AboutDialog';
import { PrivacyPolicy } from '@lyricistant/renderer/privacy/PrivacyPolicy';
import { FileHistory } from '@lyricistant/renderer/filehistory/FileHistory';
import { RouteChildrenProps } from 'react-router';
import { PlatformDialog } from '@lyricistant/renderer/dialog/PlatformDialogs';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { History } from 'history';

type ModalRoutePathNames =
  | 'about'
  | 'download'
  | 'file-history'
  | 'preferences'
  | 'privacypolicy'
  | 'settings';

type ModalRoutePath<Name extends ModalRoutePathNames = ModalRoutePathNames> =
  `/${Name}`;
interface ModalRouteProps {
  path: ModalRoutePath;
  render: (open: boolean) => ReactNode;
}
const ModalRoute = ({ path, render }: ModalRouteProps) => (
  <Route
    path={path}
    children={({ match }: RouteChildrenProps) => render(!!match)}
  />
);

export const goTo = (history: History, path: ModalRoutePathNames) => {
  history.push(`/${path}`);
};
export function Modals() {
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

  useChannel('open-about', () => goTo(history, 'about'), [history]);
  useChannel('open-prefs', () => goTo(history, 'preferences'), [history]);

  return (
    <>
      <ModalRoute
        path="/download"
        render={(open) => <ChooseDownloadDialog open={open} onClose={goBack} />}
      />
      <ModalRoute
        path="/about"
        render={(open) => <AboutDialog open={open} onClose={goBack} />}
      />
      <ModalRoute
        path="/privacypolicy"
        render={(open) => <PrivacyPolicy open={open} onClose={goBack} />}
      />
      <ModalRoute
        path="/file-history"
        render={(open) => <FileHistory open={open} onClose={goBack} />}
      />
      <ModalRoute
        path="/preferences"
        render={(open) => (
          <Preferences open={open} onClose={goBack} onAboutClicked={goAbout} />
        )}
      />
      <PlatformDialog />
    </>
  );
}
