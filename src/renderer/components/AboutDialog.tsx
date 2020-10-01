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
import React, { useMemo } from 'react';
import {
  APP_AUTHOR,
  APP_HOMEPAGE,
  APP_VERSION,
  appComponent,
} from '../globals';
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
  const logger = useMemo(() => appComponent.get<Logger>(), []);

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
          <Box height={'8px'} />
          <Grid item xs={12}>
            <Button
              variant={'outlined'}
              onClick={async () => await logger.save()}
            >
              Download Logs
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
