import {
  AlertDialogData,
  DialogData,
  FullscreenDialogData,
} from '@lyricistant/common/dialogs/Dialog';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grow,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from '@mui/material';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { makeStyles } from '@mui/styles';
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
    gap: '48px',
  },
}));

export function PlatformDialog() {
  const [dialogData, setDialogData] = useState<DialogData>(null);
  const [closeDialogTag, setCloseDialogTag] = useState<string>(null);
  const [open, setOpen] = useState(false);

  const onButtonClick = useCallback(
    (label) => {
      setDialogData(null);
      platformDelegate.send('dialog-button-clicked', dialogData.tag, label);
    },
    [dialogData]
  );

  useChannel('show-dialog', (data) => {
    setDialogData(data);
    setOpen(true);
  });
  useChannel('close-dialog', setCloseDialogTag);

  useEffect(() => {
    if (closeDialogTag && closeDialogTag === dialogData?.tag) {
      setOpen(false);
      setCloseDialogTag(null);
    }
  }, [closeDialogTag, dialogData]);

  if (!dialogData) {
    return <div />;
  }

  if (dialogData.type === 'alert') {
    return (
      <AlertDialog
        open={open}
        dialogData={dialogData}
        onButtonClick={onButtonClick}
      />
    );
  } else if (dialogData.type === 'fullscreen') {
    return (
      <FullscreenDialog
        open={open}
        dialogData={dialogData}
        onCancel={() => setDialogData(null)}
      />
    );
  }
}

const FullscreenDialog = ({
  open,
  dialogData,
  onCancel,
}: {
  open: boolean;
  dialogData: FullscreenDialogData;
  onCancel: () => void;
}) => {
  const { dialog, content, paper } = useFullscreenDialogStyles();
  return (
    <Dialog
      open={open}
      fullScreen
      className={dialog}
      TransitionComponent={Grow}
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
              size={'min(20vmin, 200px)'}
              variant={'indeterminate'}
            />
          ) : (
            <LinearProgressWithLabel value={dialogData.progress} />
          ))}
        {dialogData.cancelable && (
          <Button variant={'outlined'} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AlertDialog = ({
  open,
  dialogData,
  onButtonClick,
}: {
  open: boolean;
  dialogData: AlertDialogData;
  onButtonClick: (label: string) => void;
}) => {
  const { accordionSummary, accordionMessage, dialog } = useAlertDialogStyles();
  return (
    <Dialog open={open} className={dialog}>
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
          {dialogData.buttons.map((label, index) => (
            <Button
              key={label}
              onClick={() => onButtonClick(label)}
              color="primary"
              variant={
                index === dialogData.buttons.length - 1 ? 'contained' : 'text'
              }
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
