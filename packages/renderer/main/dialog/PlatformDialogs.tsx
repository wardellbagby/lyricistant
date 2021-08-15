import { DialogData } from '@lyricistant/common/dialogs/Dialog';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { ExpandMore } from '@material-ui/icons';
import * as React from 'react';
import { platformDelegate } from '@lyricistant/renderer/globals';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { makeStyles } from '@material-ui/core/styles';
import { Markdown } from '@lyricistant/renderer/markdown/Markdown';

const useDialogStyles = makeStyles({
  dialog: {
    overflow: 'none',
  },
  accordionSummary: {
    paddingLeft: '0px',
    paddingRight: '0px',
  },
  accordionMessage: {
    overflowY: 'auto',
    wordBreak: 'break-word',
    maxHeight: '300px',
  },
});

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
  const { accordionSummary, accordionMessage, dialog } = useDialogStyles();

  if (!dialogData) {
    return <div />;
  }

  return (
    <Dialog open className={dialog}>
      <DialogTitle>{dialogData.title}</DialogTitle>
      <DialogContent>
        {dialogData.message && (
          <DialogContentText>{dialogData.message}</DialogContentText>
        )}
        {dialogData.collapsibleMessage && (
          <Accordion elevation={0} square>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              className={accordionSummary}
            >
              <DialogContentText>
                {dialogData.collapsibleMessage.label}
              </DialogContentText>
            </AccordionSummary>
            <AccordionDetails className={accordionMessage}>
              <DialogContentText>
                <Markdown text={dialogData.collapsibleMessage.message} />
              </DialogContentText>
            </AccordionDetails>
          </Accordion>
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
