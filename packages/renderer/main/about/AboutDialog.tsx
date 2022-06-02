import { APP_HOMEPAGE, APP_VERSION } from '@lyricistant/renderer/globals';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { ReactChild } from 'react';
import appIcon from './app_icon.png';

const aboutInfo: Record<string, ReactChild> = {
  Homepage: (
    <Link target="_blank" rel="noopener" href={APP_HOMEPAGE}>
      GitHub
    </Link>
  ),
  'Author Website': (
    <Link target="_blank" rel="noopener" href={'https://wardellbagby.com'}>
      wardellbagby.com
    </Link>
  ),
  'Report an issue': (
    <Link
      target="_blank"
      rel="noopener"
      href={'https://github.com/wardellbagby/lyricistant/issues/new'}
    >
      Issues
    </Link>
  ),
};

const useTableCellStyles = makeStyles({
  root: {
    borderBottom: 'none',
  },
});

const DividerlessTableCell = (props: TableCellProps) => {
  const classes = useTableCellStyles();
  return <TableCell className={classes.root} {...props} />;
};

/**
 * The props needed to render an {@link AboutDialog}.
 */
interface AboutDialogProps {
  /**
   * Whether this dialog is opened or not.
   */
  open: boolean;
  /**
   * Invoked when the {@link AboutDialog} is closed.
   */
  onClose: () => void;
}

/**
 * A dialog that shows information about Lyricistant, links to the author, a
 * link to report issues, and a button to download logs.
 *
 * @param props The props needed to render this component.
 */
export const AboutDialog = (props: AboutDialogProps) => (
  <Dialog
    onClose={props.onClose}
    open={props.open}
    className={'paper'}
    scroll={'paper'}
  >
    <DialogContent>
      <Grid
        container
        spacing={1}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Grid item xs={12}>
          <img src={appIcon} height={'48px'} alt={'Lyricistant Icon'} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant={'h6'}>Lyricistant - {APP_VERSION}</Typography>
        </Grid>
        <Grid item xs={8}>
          <p>
            Hey! I'm Wardell, and I created Lyricistant! This app is completely
            free to use and entirely open-source. Make your own modifications,
            just make sure to make them open-source as well!
          </p>
          <p>
            I use Lyricistant personally to write my own music, which I'd love
            for you to listen to! Catch me on{' '}
            <Link
              target="_blank"
              rel="noopener"
              href={'https://open.spotify.com/artist/5NaXw8enpDRFxiTcB0J6H5'}
            >
              Spotify
            </Link>
            ,{' '}
            <Link
              target="_blank"
              rel="noopener"
              href={'https://music.apple.com/us/artist/mr-chandler/1331569890'}
            >
              Apple Music
            </Link>
            , or peep my{' '}
            <Link
              target="_blank"
              rel="noopener"
              href={'https://soundcloud.com/mr-chandler'}
            >
              SoundCloud.
            </Link>
          </p>
          <p>Enjoy using Lyricistant!</p>
        </Grid>
        <Grid item xs={12}>
          <TableContainer>
            <Table size={'small'}>
              <TableBody>
                {Object.keys(aboutInfo)
                  .map((key: keyof typeof aboutInfo) => [key, aboutInfo[key]])
                  .map(([key, value]: [string, ReactChild]) => (
                    <TableRow key={key}>
                      <DividerlessTableCell>{key}</DividerlessTableCell>
                      <DividerlessTableCell>{value}</DividerlessTableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Box height={'8px'} />
        <Grid item xs={12}>
          <Button
            variant={'outlined'}
            onClick={() => platformDelegate.send('save-logs')}
          >
            Download Logs
          </Button>
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button fullWidth variant={'contained'} onClick={props.onClose}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
);
