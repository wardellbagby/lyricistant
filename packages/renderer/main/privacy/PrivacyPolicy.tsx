import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';

export const PrivacyPolicy = () => {
  const history = useHistory();
  const onClose = () => history.replace('/');

  return (
    <Dialog onClose={onClose} open className={'paper'}>
      <DialogTitle>Privacy Policy</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Lyricistant doesn't collect or store any data from you. Nothing. Nada.
          Zilch. Zero.
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};
