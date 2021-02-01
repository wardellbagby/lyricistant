import { DialogData } from '@common/dialogs/Dialog';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from '@material-ui/core';
import { useCallback, useState } from 'react';
import * as React from 'react';
import { platformDelegate } from '../globals';
import { useChannel } from '../hooks/useChannel';

export function PlatformDialog() {
  const [dialogData, setDialogData] = useState<DialogData>(null);
  const onButtonClick = useCallback(
    (label) => {
      setDialogData(null);
      platformDelegate.send('dialog-button-clicked', dialogData.tag, label);
    },
    [dialogData]
  );

  useChannel('show-dialog', setDialogData, [setDialogData]);

  if (!dialogData) {
    return <div />;
  }

  return (
    <Dialog open>
      <DialogTitle>{dialogData.title}</DialogTitle>
      <DialogContent>
        {dialogData.message && (
          <DialogContentText>{dialogData.message}</DialogContentText>
        )}
        {dialogData.progress && (
          <LinearProgressWithLabel value={dialogData.progress} />
        )}
      </DialogContent>

      {dialogData.buttons && (
        <DialogActions>
          {dialogData.buttons.map((label) => (
            <Button
              key={label}
              onClick={() => onButtonClick(label)}
              color="primary"
            >
              {label}
            </Button>
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
}

const LinearProgressWithLabel = (
  props: LinearProgressProps & { value: number }
) => (
  <Box
    display="flex"
    alignItems="center"
    paddingTop={'16px'}
    paddingBottom={'16px'}
    paddingLeft={'8px'}
    paddingRight={'8px'}
  >
    <Box width="100%" mr={1}>
      <LinearProgress variant="determinate" {...props} />
    </Box>
    <Box minWidth={35}>
      <Typography variant="body2" color="textSecondary">{`${Math.round(
        props.value
      )}%`}</Typography>
    </Box>
  </Box>
);
