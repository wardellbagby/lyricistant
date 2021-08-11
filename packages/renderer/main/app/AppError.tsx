import { isDevelopment } from '@lyricistant/common/BuildModes';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  TextareaAutosize,
  Typography,
} from '@material-ui/core';
import React, { useCallback, useEffect } from 'react';
import Link from '@material-ui/core/Link';
import { logger } from '@lyricistant/renderer/globals';
import { useEditorText } from '@lyricistant/renderer/editor/EditorTextStore';

interface AppErrorProps {
  error: Error;
}
export function AppError({ error }: AppErrorProps) {
  const onClose = useCallback(() => window.location.reload(), []);
  const onCopy = useCallback(
    () => window.navigator.clipboard.writeText(editorText),
    []
  );
  const editorText = useEditorText();
  useEffect(() => {
    logger.error('Error in renderer', error);
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
              rowsMax={6}
              readOnly
              defaultValue={error.stack}
            />
          </Box>
        )}
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
