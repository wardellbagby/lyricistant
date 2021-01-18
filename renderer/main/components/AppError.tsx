import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import React, { useCallback } from 'react';

export function AppError({ editorText }: { editorText: string }) {
  const onClose = useCallback(() => window.location.reload(), []);
  const onCopy = useCallback(
    () => window.navigator.clipboard.writeText(editorText),
    []
  );
  return (
    <Dialog onClose={onClose} open={true}>
      <DialogTitle>Application Error</DialogTitle>
      <Box paddingLeft={'32px'} paddingRight={'32px'} paddingBottom={'24px'}>
        <Typography variant={'body2'}>
          Sorry, an error has occurred in Lyricistant. Please reload the page to
          continue. You can copy your current lyrics to the clipboard.{' '}
        </Typography>
      </Box>
      <DialogActions>
        <Button variant={'contained'} onClick={onCopy}>
          Copy
        </Button>
        <Button variant={'contained'} onClick={onClose}>
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
