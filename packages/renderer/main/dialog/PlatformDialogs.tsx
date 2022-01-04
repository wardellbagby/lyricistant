import {
  AlertDialogData,
  DialogData,
  FullscreenDialogData,
} from '@lyricistant/common/dialogs/Dialog';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { ExpandMore } from '@material-ui/icons';
import * as React from 'react';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { makeStyles, alpha } from '@material-ui/core/styles';
import { Markdown } from '@lyricistant/renderer/markdown/Markdown';

const useAlertDialogStyles = makeStyles({
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

const useFullscreenDialogStyles = makeStyles((theme) => ({
  dialog: {
    overflow: 'none',
  },
  paper: {
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '24px',
  },
}));

export function PlatformDialog() {
  const [dialogData, setDialogData] = useState<DialogData>(null);
  const [closeDialogTag, setCloseDialogTag] = useState<string>(null);
  const onButtonClick = useCallback(
    (label) => {
      setDialogData(null);
      platformDelegate.send('dialog-button-clicked', dialogData.tag, label);
    },
    [dialogData]
  );

  useChannel('show-dialog', setDialogData);
  useChannel('close-dialog', setCloseDialogTag);

  useEffect(() => {
    if (closeDialogTag && closeDialogTag === dialogData?.tag) {
      setDialogData(null);
      setCloseDialogTag(null);
    }
  }, [closeDialogTag, dialogData]);

  if (!dialogData) {
    return <div />;
  }

  if (dialogData.type === 'alert') {
    return (
      <AlertDialog dialogData={dialogData} onButtonClick={onButtonClick} />
    );
  } else if (dialogData.type === 'fullscreen') {
    return <FullscreenDialog dialogData={dialogData} />;
  }
}

const FullscreenDialog = ({
  dialogData,
}: {
  dialogData: FullscreenDialogData;
}) => {
  const { dialog, content, paper } = useFullscreenDialogStyles();
  return (
    <Dialog
      open
      fullScreen
      className={dialog}
      PaperProps={{ className: paper }}
    >
      <DialogContent className={content}>
        {dialogData.message && (
          <DialogContentText variant={'h5'}>
            {dialogData.message}
          </DialogContentText>
        )}
        {dialogData.progress &&
          (dialogData.progress === 'indeterminate' ? (
            <CircularProgress
              size={'min(25vmin, 200px)'}
              variant={'indeterminate'}
            />
          ) : (
            <LinearProgressWithLabel value={dialogData.progress} />
          ))}
      </DialogContent>
    </Dialog>
  );
};

const AlertDialog = ({
  dialogData,
  onButtonClick,
}: {
  dialogData: AlertDialogData;
  onButtonClick: (label: string) => void;
}) => {
  const { accordionSummary, accordionMessage, dialog } = useAlertDialogStyles();
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
};

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
