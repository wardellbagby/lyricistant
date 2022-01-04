import { Box, Button, Dialog, DialogTitle, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Apple, AppleIos, Linux, MicrosoftWindows } from 'mdi-material-ui';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  latestReleaseUrl,
  Release,
  supportedReleases,
} from '@lyricistant/renderer/download';
import { Android } from '@material-ui/icons';

const useStyles = (release: Release) =>
  makeStyles(() => ({
    root: {
      background: releaseColor(release),
      color: releaseTextColor(release),
      textTransform: 'none',
    },
  }))();

const releaseColor = ({ platform }: Release) => {
  switch (platform) {
    case 'Linux':
      return '#0099cc';
    case 'Android':
      return '#3DDC84';
    case 'Mac':
    case 'iOS':
      return '#555555';
    case 'Windows':
      return '#00A4EF';
  }
};

const downloadLabel = ({ platform, arch }: Release) => {
  switch (platform) {
    case 'Linux':
      return `${platform} - ${arch}`;
    case 'iOS':
      return 'iPhone / iPad';
    default:
      return platform;
  }
};

const releaseTextColor = ({ platform }: Release) => {
  switch (platform) {
    case 'Mac':
    case 'iOS':
      return '#FFFFFF';
    case 'Windows':
    case 'Linux':
    case 'Android':
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
        {downloadLabel(release)}
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
        <Grid container spacing={1} alignItems={'center'} justify={'center'}>
          {[...releases.keys()].map((platform) =>
            releases.get(platform).map((release) => (
              <Grid key={release.asset} item xs={6}>
                <DownloadButton
                  release={release}
                  onClick={() => {
                    handleReleaseClicked(
                      release.url ?? latestReleaseUrl + release.asset
                    );
                  }}
                />
              </Grid>
            ))
          )}
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
    case 'Windows':
      return <MicrosoftWindows />;
    case 'Android':
      return <Android />;
    case 'iOS':
      return <AppleIos />;
  }
};
