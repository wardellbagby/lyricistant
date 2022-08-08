import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
  open: boolean;
}

export const PrivacyPolicy = (props: PrivacyPolicyProps) => (
  <Dialog onClose={props.onClose} open={props.open} className={'paper'}>
    <DialogTitle>Privacy policy</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Lyricistant doesn't collect or store any data from you. Nothing. Nada.
        Zilch. Zero.
      </DialogContentText>
    </DialogContent>
  </Dialog>
);
