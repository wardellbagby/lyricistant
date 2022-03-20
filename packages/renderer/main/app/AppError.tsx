import { isDevelopment } from '@lyricistant/common/BuildModes';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Link,
  TextareaAutosize,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect } from 'react';

interface AppErrorProps {
  error: any;
  editorText: string;
}

export function AppError({ error, editorText }: AppErrorProps) {
  const onClose = useCallback(() => window.location.reload(), []);
  const onCopy = useCallback(
    () => window.navigator.clipboard.writeText(editorText),
    []
  );

  useEffect(() => {
    logger.error('Error in renderer', error.toString());
  }, [error]);
  return (
    <Dialog onClose={onClose} open>
      <DialogTitle>Application Error</DialogTitle>
      <Box paddingLeft={'32px'} paddingRight={'32px'} paddingBottom={'24px'}>
        <Typography paragraph>
          Sorry, an error has occurred in Lyricistant. Please reload the page to
          continue. You can copy your current lyrics to the clipboard.
        </Typography>
        <Link
          href={'https://github.com/wardellbagby/lyricistant/issues/new'}
          rel="noopener"
          variant={'body1'}
        >
          Click here to report an issue.
        </Link>
        {isDevelopment && (
          <Box
            fontFamily={'Roboto Mono'}
            width={'100%'}
            minWidth={'100%'}
            maxWidth={'100%'}
          >
            <TextareaAutosize
              wrap={'soft'}
              maxRows={6}
              readOnly
              defaultValue={
                error?.stack ?? error?.reason ?? JSON.stringify(error)
              }
            />
          </Box>
        )}
      </Box>
      <DialogActions>
        <Button variant={'contained'} onClick={onCopy}>
          Copy Lyrics
        </Button>
        <Button variant={'contained'} onClick={onClose}>
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
