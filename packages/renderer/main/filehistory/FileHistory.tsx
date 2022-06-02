import { ParsedHistoryData } from '@lyricistant/common/history/ParsedHistoryData';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  SxProps,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

interface FileHistoryItemProps {
  data: ParsedHistoryData;
  onClick: () => void;
}

const FileHistoryItem = ({ data, onClick }: FileHistoryItemProps) => (
  <ListItem button onClick={onClick}>
    <ListItemText primary={data.time} />
  </ListItem>
);

interface FileHistoryProps {
  open: boolean;
  onClose: () => void;
}

/**
 * A dialog that displays file history from the platform and allows the user to select a file history to apply.
 *
 * @param props The props needed to render this component.
 */
export function FileHistory(props: FileHistoryProps) {
  const onClose = useCallback(() => {
    setDisplayedHistory(null);
    props.onClose();
  }, []);

  const [fileHistory] = useChannelData('file-history', [props.open]);
  const [displayedHistory, setDisplayedHistory] =
    useState<ParsedHistoryData>(null);

  const anchor = useSmallLayout() ? 'bottom' : 'right';

  const drawerStyles: SxProps =
    anchor === 'right'
      ? { width: '35%', maxWidth: '400px' }
      : { height: '50%', maxHeight: '500px' };

  return (
    <>
      <Dialog
        open={!!displayedHistory}
        maxWidth={'md'}
        onClose={() => setDisplayedHistory(null)}
      >
        <DialogTitle>{displayedHistory?.time}</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {displayedHistory?.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisplayedHistory(null)}>Close</Button>
          <Button
            onClick={() => {
              platformDelegate.send('apply-file-history', displayedHistory);
              setDisplayedHistory(null);
              onClose();
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      <Drawer
        onClose={onClose}
        open={props.open}
        className={'paper'}
        anchor={anchor}
        PaperProps={{ sx: drawerStyles }}
      >
        <DialogTitle>File History</DialogTitle>
        <Divider />
        <DialogContent>
          {fileHistory?.length > 0 ? (
            <List>
              {fileHistory.map((data, index) => (
                <>
                  <FileHistoryItem
                    data={data}
                    key={index}
                    onClick={() => setDisplayedHistory(data)}
                  />
                  <Divider />
                </>
              ))}
            </List>
          ) : (
            <DialogContentText>No file history.</DialogContentText>
          )}
        </DialogContent>
      </Drawer>
    </>
  );
}
