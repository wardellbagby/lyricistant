import { Box, Button, Grid, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import { Apple, Linux, MicrosoftWindows, Ubuntu } from 'mdi-material-ui';
import React, { useMemo } from 'react';
import {
  latestReleaseUrl,
  Release,
  supportedReleases,
} from '../util/download-app';

const useStyles = (release: Release) =>
  makeStyles(() => ({
    root: {
      background: releaseColor(release),
      color: releaseTextColor(release),
    },
  }))();

const releaseColor = ({ platform }: Release) => {
  switch (platform) {
    case 'Linux':
      return '#98ff98';
    case 'Mac':
      return '#A3AAAE';
    case 'Ubuntu':
      return '#E95420';
    case 'Windows':
      return '#00A4EF';
  }
};

const releaseTextColor = ({ platform }: Release) => {
  switch (platform) {
    case 'Linux':
      return '#000000';
    case 'Mac':
      return '#000000';
    case 'Ubuntu':
      return '#FFFFFF';
    case 'Windows':
      return '#000000';
  }
};

const DownloadButton = (props: { release: Release; onClick: () => void }) => {
  const { release, onClick } = props;
  const classes = useStyles(release);

  return (
    <Button
      className={classes.root}
      variant={'contained'}
      fullWidth
      startIcon={<ReleaseIcon release={release} />}
      size={'large'}
      onClick={onClick}
    >
      {release.arch ?? 'Download'}
    </Button>
  );
};

export interface SimpleDialogProps {
  show: boolean;
  onClose: () => void;
}

export const ChooseDownloadDialog = (props: SimpleDialogProps) => {
  const { onClose, show } = props;

  const handleClose = () => {
    onClose();
  };

  const handleReleaseClicked = (url: string) => {
    window.open(url, '_blank');
    onClose();
  };

  const releases = useMemo(() => {
    return supportedReleases.reduce((map, release) => {
      const list = map.get(release.platform) ?? [];
      map.set(release.platform, [...list, release]);
      return map;
    }, new Map<string, Release[]>());
  }, []);

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="choose-download-dialog-title"
      open={show}
    >
      <DialogTitle id="choose-download-dialog-title">
        Download Lyricistant
      </DialogTitle>
      <Box paddingLeft={'16px'} paddingRight={'16px'} paddingBottom={'32px'}>
        <Grid container spacing={2}>
          {[...releases.keys()].map((platform) => {
            return (
              <React.Fragment key={platform}>
                <Grid item xs={12}>
                  <Typography variant={'subtitle1'}>{platform}</Typography>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                  {releases.get(platform).map((release) => {
                    return (
                      <Grid key={release.asset} item sm={4} md={6}>
                        <DownloadButton
                          release={release}
                          onClick={() => {
                            handleReleaseClicked(
                              latestReleaseUrl + release.asset
                            );
                          }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </React.Fragment>
            );
          })}
        </Grid>
      </Box>
      <Button
        size={'large'}
        variant={'contained'}
        fullWidth
        onClick={() => handleClose()}
      >
        Close
      </Button>
    </Dialog>
  );
};

const ReleaseIcon = (props: { release: Release }) => {
  const { platform } = props.release;
  switch (platform) {
    case 'Linux':
      return <Linux />;
    case 'Mac':
      return <Apple />;
    case 'Ubuntu':
      return <Ubuntu />;
    case 'Windows':
      return <MicrosoftWindows />;
  }
};
