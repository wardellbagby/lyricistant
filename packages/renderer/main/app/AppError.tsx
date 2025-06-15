import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Link,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect } from 'react';

interface AppErrorProps {
  error: unknown;
  editorText: string;
}

/**
 * A dialog that displays whenever an unrecoverable error occurs while
 * Lyricistant is running.
 *
 * @param error The error that occured. While display in development build.
 * @param editorText The text that was in the editor before the error occurred.
 */
export function AppError({ error, editorText }: AppErrorProps) {
  const onClose = useCallback(() => window.location.reload(), []);
  const onCopy = useCallback(
    () => window.navigator.clipboard.writeText(editorText),
    [],
  );
  const onDownloadLogs = useCallback(() => {
    platformDelegate.send('save-logs');
  }, []);

  useEffect(() => {
    logger.error('Error in renderer', error.toString());
  }, [error]);
  return (
    <Dialog onClose={onClose} open>
      <DialogTitle>Application error</DialogTitle>
      <Box paddingLeft={'32px'} paddingRight={'32px'} paddingBottom={'24px'}>
        <Typography component="p">
          Sorry, an error has occurred in Lyricistant. Press reload to continue,
          but any unsaved data may be lost. You can also copy your current
          lyrics to the clipboard, and attempt to download logs.
        </Typography>
        <Link
          href={'https://github.com/wardellbagby/lyricistant/issues/new/choose'}
          rel="noopener"
          variant={'body1'}
        >
          Click here to report an issue.
        </Link>
      </Box>
      <DialogActions>
        <Button variant={'text'} onClick={onDownloadLogs}>
          Download logs
        </Button>
        <Button variant={'text'} onClick={onCopy}>
          Copy lyrics
        </Button>
        <Button variant={'text'} color={'warning'} onClick={onClose}>
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
