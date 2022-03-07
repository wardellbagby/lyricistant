import { UiConfig } from '@lyricistant/common/ui/UiConfig';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React, { useState } from 'react';
import { PropsWithChildren } from 'react';
import { isIE, isMobile } from 'react-device-detect';

const isUnsupportedBrowser = isMobile || isIE || !Promise || !File || !Blob;

const getTipMessage = () => {
  if (isMobile) {
    return 'Try switching to a desktop browser.';
  } else {
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
export function SupportedBrowserWarning({
  children,
}: PropsWithChildren<Record<never, never>>) {
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);
  useChannel('ui-config', setUiConfig);
  const [isAcknowledged, setAcknowledged] = useState(false);
  const showWarning =
    uiConfig?.showBrowserWarning === true &&
    isUnsupportedBrowser &&
    !isAcknowledged;
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
