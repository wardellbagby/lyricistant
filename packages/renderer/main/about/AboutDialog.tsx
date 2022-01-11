import {
  Box,
  Button,
  Dialog,
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
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  APP_AUTHOR,
  APP_HOMEPAGE,
  APP_VERSION,
} from '@lyricistant/renderer/globals';
import appIcon from './app_icon.png';

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

const useTableCellStyles = makeStyles({
  root: {
    borderBottom: 'none',
  },
});

const DividerlessTableCell = (props: TableCellProps) => {
  const classes = useTableCellStyles();
  return <TableCell className={classes.root} {...props} />;
};

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
          justifyContent="center"
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
                  {Object.keys(aboutInfo)
                    .map((key: keyof typeof aboutInfo) => [key, aboutInfo[key]])
                    .map(([key, value]) => (
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
