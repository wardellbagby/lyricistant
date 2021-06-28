import React, { useState } from 'react';
import { PropsWithChildren } from 'react';
import { isIE, isMobile } from 'react-device-detect';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

const isUnsupportedBrowser = isMobile || isIE;

const getTipMessage = () => {
  if (isMobile) {
    return 'Try switching to a desktop browser.';
  }
  if (isIE) {
    return 'Try switching to a more modern browser.';
  }
};

const WarningDialog = ({ onContinue }: { onContinue: () => void }) => (
    <Dialog open>
      <DialogTitle>Unsupported Browser</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Lyricistant doesn't currently support your browser. You might
          experience some bugs or performance issues. {getTipMessage()}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button key="no" onClick={() => window.history.back()} color="primary">
          Go Back
        </Button>
        <Button key="yes" onClick={onContinue} color="primary">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
export function DesktopOnly({
  children,
}: PropsWithChildren<Record<never, never>>) {
  const [isAcknowledged, setAcknowledged] = useState(false);
  if (isUnsupportedBrowser && !isAcknowledged) {
    return <WarningDialog onContinue={() => setAcknowledged(true)} />;
  } else {
    return <>{children}</>;
  }
}
