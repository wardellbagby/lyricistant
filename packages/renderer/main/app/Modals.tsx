import { AboutDialog } from '@lyricistant/renderer/about/AboutDialog';
import {
  RoutePaths,
  useBackNavigation,
  useNavigation,
} from '@lyricistant/renderer/app/Navigation';
import { ChooseDownloadDialog } from '@lyricistant/renderer/download/ChooseDownloadDialog';
import { FileHistory } from '@lyricistant/renderer/filehistory/FileHistory';
import { PlatformDialogs } from '@lyricistant/renderer/platform/PlatformDialogs';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { Preferences } from '@lyricistant/renderer/preferences/Preferences';
import { PrivacyPolicy } from '@lyricistant/renderer/privacy/PrivacyPolicy';
import React, { ReactElement, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ModalRouteProps {
  path: RoutePaths;
  render: (open: boolean) => ReactElement;
}

const ModalRoute = ({ path, render }: ModalRouteProps) => {
  const [location] = useLocation();
  return <>{render(path.replace('/', '') === location)}</>;
};

/** Displays various models over Lyricistant based on the current router path. */
export function Modals() {
  const navigate = useNavigation();
  const goBack = useBackNavigation();

  useEffect(() => {
    logger.verbose('Navigation', location.pathname);
  }, [location]);

  useChannel('open-about', () => navigate('/about'), []);
  useChannel('open-prefs', () => navigate('/preferences'), []);

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
          <Preferences
            open={open}
            onClose={goBack}
            onAboutClicked={() => navigate('/about', { replace: true })}
          />
        )}
      />
      <PlatformDialogs />
    </>
  );
}
