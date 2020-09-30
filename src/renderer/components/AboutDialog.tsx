import {
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
import { APP_AUTHOR, APP_HOMEPAGE, APP_VERSION } from '../globals';
import appIcon from '../images/app_icon.png';

export interface AboutDialogProps {
  show: boolean;
  onClose: () => void;
}

const aboutInfo = {
  Author: APP_AUTHOR,
  Version: APP_VERSION,
  Homepage: (
    <Link target="_blank" href={APP_HOMEPAGE}>
      GitHub
    </Link>
  ),
};

const DividerlessTableCell = withStyles({
  root: {
    borderBottom: 'none',
  },
})(TableCell);

export const AboutDialog = (props: AboutDialogProps) => {
  const { onClose, show } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog onClose={handleClose} open={show} className={'paper'}>
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
                  {Object.entries(aboutInfo).map(([key, value]) => {
                    return (
                      <TableRow>
                        <DividerlessTableCell>{key}</DividerlessTableCell>
                        <DividerlessTableCell>{value}</DividerlessTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
