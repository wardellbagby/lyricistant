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
} from '@mui/material';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { UiConfig } from '@lyricistant/common/ui/UiConfig';

const isUnsupportedBrowser = isMobile || isIE;

const getTipMessage = () => {
  if (isMobile) {
    return 'Try switching to a desktop browser.';
  }
  if (isIE) {
    return 'Try switching to a more modern browser.';
  }
};

const WarningDialog = ({
  onContinue,
  open,
}: {
  onContinue: () => void;
  open: boolean;
}) => (
  <Dialog open={open}>
    <DialogTitle>Unsupported Browser</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Lyricistant doesn't currently support your browser. You might experience
        some bugs or performance issues. {getTipMessage()}
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
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);
  useChannel('ui-config', setUiConfig);
  const [isAcknowledged, setAcknowledged] = useState(false);
  const showWarning =
    uiConfig?.showBrowserWarning && isUnsupportedBrowser && !isAcknowledged;
  return (
    <>
      <WarningDialog
        open={showWarning}
        onContinue={() => setAcknowledged(true)}
      />
      {children}
    </>
  );
}
