import {
  Box,
  Button,
  DialogContent,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  withStyles,
} from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  APP_AUTHOR,
  APP_HOMEPAGE,
  APP_VERSION,
  platformDelegate,
} from '../globals';
import appIcon from '../images/app_icon.png';

const aboutInfo = {
  Author: APP_AUTHOR,
  Version: APP_VERSION,
  Homepage: (
    <Link target="_blank" rel="noopener" href={APP_HOMEPAGE}>
      GitHub
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

const DividerlessTableCell = withStyles({
  root: {
    borderBottom: 'none',
  },
})(TableCell);

export const AboutDialog = () => {
  const history = useHistory();
  const onClose = () => history.replace('/');

  return (
    <Dialog onClose={onClose} open className={'paper'}>
      <DialogContent>
        <Grid
          container
          spacing={1}
          direction="column"
          justify="center"
          alignItems="center"
        >
          <Grid item xs={12}>
            <img src={appIcon} height={'48px'} alt={'Lyricistant Icon'} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant={'h6'}>Lyricistant</Typography>
          </Grid>
          <Grid item xs={12}>
            <TableContainer>
              <Table size={'small'}>
                <TableBody>
                  {Object.entries(aboutInfo).map(([key, value]) => (
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
    </Dialog>
  );
};
