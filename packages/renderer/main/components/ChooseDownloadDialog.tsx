import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  Grid,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Apple, Linux, MicrosoftWindows, Ubuntu } from 'mdi-material-ui';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { logger } from '../globals';
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
    <Box padding={'8px'}>
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
    </Box>
  );
};

export const ChooseDownloadDialog = () => {
  const history = useHistory();
  const onClose = () => history.replace('/');

  const handleReleaseClicked = (url: string) => {
    logger.info(`App download link clicked. Chosen URL: ${url}`);
    window.open(url, '_blank');
    onClose();
  };

  const releases = useMemo(
    () =>
      supportedReleases.reduce((map, release) => {
        const list = map.get(release.platform) ?? [];
        map.set(release.platform, [...list, release]);
        return map;
      }, new Map<string, Release[]>()),
    []
  );

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="choose-download-dialog-title"
      open
    >
      <DialogTitle id="choose-download-dialog-title">
        Download Lyricistant
      </DialogTitle>
      <Box paddingLeft={'16px'} paddingRight={'16px'} paddingBottom={'32px'}>
        <Grid container spacing={4} alignItems={'center'} justify={'center'}>
          {[...releases.keys()].map((platform) => (
            <Grid
              container
              item
              alignItems={'center'}
              justify={'center'}
              key={platform}
            >
              <Grid item xs={12}>
                <Typography align={'center'} variant={'h6'}>
                  {platform}
                </Typography>
              </Grid>
              {releases.get(platform).map((release, index, archs) => (
                <Grid key={release.asset} item xs={archs.length === 1 ? 8 : 6}>
                  <DownloadButton
                    release={release}
                    onClick={() => {
                      handleReleaseClicked(latestReleaseUrl + release.asset);
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Box>
      <Button size={'large'} variant={'contained'} fullWidth onClick={onClose}>
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
