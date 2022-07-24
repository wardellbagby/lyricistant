import {
  Chunk,
  ChunkLine,
  ParsedHistoryData,
} from '@lyricistant/common/history/ParsedHistoryData';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import {
  Box,
  Button,
  CircularProgress,
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
  Theme,
  useTheme,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

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

const VisualChunkLine = (props: { line: ChunkLine }) => {
  const theme = useTheme();
  const { backgroundColor, foregroundColor } = useMemo(() => {
    if (props.line.type === 'new') {
      return {
        backgroundColor: theme.palette.success.main,
        foregroundColor: theme.palette.success.contrastText,
      };
    } else if (props.line.type === 'old') {
      return {
        backgroundColor: theme.palette.error.main,
        foregroundColor: theme.palette.error.contrastText,
      };
    }
    return {};
  }, [theme]);
  const fontFamily = useMemo(() => {
    if (props.line.control) {
      return 'monospace';
    }
  }, [props.line.control]);

  return (
    <Box
      sx={{
        background: backgroundColor,
        color: foregroundColor,
        fontFamily,
      }}
    >
      {props.line.line}
    </Box>
  );
};
const VisualChunk = (props: { chunk: Chunk }) => (
  <Box
    marginBottom={'12px'}
    padding={'12px'}
    sx={{
      border: 2,
      borderRadius: 1,
      borderColor: (theme: Theme) => theme.palette.divider,
    }}
  >
    {props.chunk.lines.map((line, index) => (
      <VisualChunkLine key={index} line={line} />
    ))}
  </Box>
);

const FileHistoryList = (props: {
  historyData: ParsedHistoryData[];
  onFileHistoryClicked: (history: ParsedHistoryData) => void;
}) => {
  if (props.historyData?.length === 0) {
    return <DialogContentText>No file history.</DialogContentText>;
  }
  if (!props.historyData) {
    return (
      <Box
        width={'100%'}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <CircularProgress size={'48px'} variant={'indeterminate'} />
      </Box>
    );
  }
  return (
    <List>
      {props.historyData.map((data, index) => (
        <React.Fragment key={index}>
          <FileHistoryItem
            data={data}
            onClick={() => {
              props.onFileHistoryClicked(data);
            }}
          />
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
};
/**
 * A dialog that displays file history from the platform and allows the user to
 * select a file history to apply.
 *
 * @param props The props needed to render this component.
 */
export function FileHistory(props: FileHistoryProps) {
  const onClose = useCallback(() => {
    setDisplayedHistory(null);
    props.onClose();
  }, []);

  const [historyData] = useChannelData('file-history', props.open);
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
          {displayedHistory?.chunks.map((chunk, index) => (
            <VisualChunk key={index} chunk={chunk} />
          ))}
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
          <FileHistoryList
            historyData={historyData}
            onFileHistoryClicked={setDisplayedHistory}
          />
        </DialogContent>
      </Drawer>
    </>
  );
}
