import {
  AlertDialogData,
  DialogData,
  DialogInteractionData,
  FullscreenDialogData,
  SelectionDialogData,
} from '@lyricistant/common/dialogs/Dialog';
import { Markdown } from '@lyricistant/renderer/markdown/Markdown';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grow,
  LinearProgress,
  LinearProgressProps,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

/** Displays dialogs that the platform has requested to be shown. */
export function PlatformDialogs() {
  const [dialogData, setDialogData] = useState<DialogData>(null);
  const [closeDialogTag, setCloseDialogTag] = useState<string>(null);
  const [open, setOpen] = useState(false);

  const onDialogInteraction = useCallback(
    (interactionData: DialogInteractionData) => {
      setOpen(false);
      platformDelegate.send(
        'dialog-interaction',
        dialogData.tag,
        interactionData
      );
      platformDelegate.send('dialog-closed', dialogData.tag);
    },
    [dialogData]
  );

  const onClosed = useCallback(() => {
    setOpen(false);
    platformDelegate.send('dialog-closed', dialogData.tag);
  }, [dialogData]);

  useChannel('show-dialog', (data) => {
    setDialogData(data);
    setOpen(true);
  });
  useChannel('close-dialog', setCloseDialogTag);

  useEffect(() => {
    if (closeDialogTag && closeDialogTag === dialogData?.tag) {
      setOpen(false);
      setCloseDialogTag(null);
      platformDelegate.send('dialog-closed', dialogData.tag);
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
        onDialogInteraction={onDialogInteraction}
      />
    );
  } else if (dialogData.type === 'fullscreen') {
    return (
      <FullscreenDialog
        open={open}
        dialogData={dialogData}
        onCancel={onClosed}
      />
    );
  } else if (dialogData.type === 'selection') {
    return (
      <SelectionDialog
        open={open}
        dialogData={dialogData}
        onDialogInteraction={onDialogInteraction}
        onClosed={onClosed}
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
}) => (
  <Dialog
    open={open}
    fullScreen
    sx={{
      overflow: 'none',
    }}
    TransitionComponent={Grow}
    PaperProps={{
      sx: {
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.5),
      },
    }}
  >
    <DialogContent
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '48px',
      }}
    >
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

const AlertDialog = ({
  open,
  dialogData,
  onDialogInteraction,
}: {
  open: boolean;
  dialogData: AlertDialogData;
  onDialogInteraction: (interactionData: DialogInteractionData) => void;
}) => {
  const [text, setText] = useState<string>(
    dialogData.textField?.defaultValue ?? ''
  );

  return (
    <Dialog
      open={open}
      sx={{
        overflow: 'none',
      }}
    >
      <DialogTitle>{dialogData.title}</DialogTitle>
      <DialogContent>
        {dialogData.message && (
          <DialogContentText>{dialogData.message}</DialogContentText>
        )}
        {dialogData.collapsibleMessage && (
          <Accordion elevation={0} square>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                paddingLeft: '0px',
                paddingRight: '0px',
              }}
            >
              <DialogContentText>
                {dialogData.collapsibleMessage.label}
              </DialogContentText>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                overflowY: 'auto',
                wordBreak: 'break-word',
                maxHeight: '300px',
              }}
            >
              <DialogContentText>
                <Markdown text={dialogData.collapsibleMessage.message} />
              </DialogContentText>
            </AccordionDetails>
          </Accordion>
        )}
        {dialogData.progress && (
          <LinearProgressWithLabel value={dialogData.progress} />
        )}
        {dialogData.textField && (
          <TextField
            fullWidth
            margin={'dense'}
            variant={'outlined'}
            label={dialogData.textField.label}
            value={text}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setText(event.target.value);
            }}
          />
        )}
      </DialogContent>

      {dialogData.buttons && (
        <DialogActions>
          {dialogData.buttons.map((label, index) => (
            <Button
              key={label}
              onClick={() => {
                onDialogInteraction({ selectedButton: label, textField: text });
              }}
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

const SelectionDialog = ({
  open,
  dialogData,
  onDialogInteraction,
  onClosed,
}: {
  open: boolean;
  dialogData: SelectionDialogData;
  onDialogInteraction: (interactionData?: DialogInteractionData) => void;
  onClosed: () => void;
}) => {
  const [selection, setSelection] = useState<string>(dialogData.options[0]);
  const [isChecked, setChecked] = useState(false);
  return (
    <Dialog open={open}>
      <DialogTitle>{dialogData.title}</DialogTitle>
      <DialogContent>
        <p>
          {dialogData.message && (
            <DialogContentText>{dialogData.message}</DialogContentText>
          )}
        </p>
        <Select
          value={selection}
          fullWidth
          onChange={(event) => setSelection(event.target.value)}
        >
          {dialogData.options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>

        {dialogData.checkbox && (
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  value={isChecked}
                  onChange={(event) => {
                    setChecked(event.target.checked);
                  }}
                />
              }
              label={dialogData.checkbox.label}
            />
          </FormGroup>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClosed()} color="primary" variant={'text'}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onDialogInteraction({
              selectedButton: 'Confirm',
              selectedOption: selection,
              checkboxes: {
                [dialogData.checkbox.label]: isChecked,
              },
            });
          }}
          color="primary"
          variant={'contained'}
        >
          Confirm
        </Button>
      </DialogActions>
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
