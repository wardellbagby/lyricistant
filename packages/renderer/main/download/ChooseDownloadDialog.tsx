import {
  latestReleaseUrl,
  Release,
  supportedReleases,
} from '@lyricistant/renderer/download';
import { Android } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogTitle,
  Grid,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Apple, AppleIos, Linux, MicrosoftWindows } from 'mdi-material-ui';
import React, { useMemo } from 'react';

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

const PlatformDownloadOptions = (props: {
  platform: string;
  releases: Release[];
  onClick: (release: Release) => void;
}) => {
  const children = useMemo(
    () =>
      props.releases.map((release) => (
        <Grid
          key={`${release.platform}/${release.asset}/${release.url}`}
          item
          xs={6}
        >
          <DownloadButton
            release={release}
            onClick={() => {
              props.onClick(release);
            }}
          />
        </Grid>
      )),
    [props.releases, props.onClick]
  );

  if (props.releases.length > 1) {
    return (
      <Grid
        item
        container
        xs={12}
        spacing={1}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Grid item xs={12}>
          <Accordion
            key={props.platform + 'accordion'}
            sx={{ padding: '0px', boxShadow: 'unset' }}
          >
            <AccordionSummary sx={{ padding: '0px' }}>
              <Box padding={'8px'} width={'100%'}>
                <Button
                  sx={{
                    background: releaseColor(props.releases[0]),
                    color: releaseTextColor(props.releases[0]),
                    textTransform: 'none',
                  }}
                  variant={'contained'}
                  fullWidth
                  startIcon={<ReleaseIcon platform={props.platform} />}
                  size={'large'}
                >
                  {props.platform}
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container>{children}</Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    );
  } else {
    return <>{children}</>;
  }
};

const downloadLabel = ({
  platform,
  arch,
}: {
  platform: string;
  arch?: string;
}) => {
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

const DownloadButton = (props: { release: Release; onClick?: () => void }) => {
  const { release, onClick } = props;
  const classes = useStyles(release);

  return (
    <Box padding={'8px'}>
      <Button
        className={classes.root}
        variant={'contained'}
        fullWidth
        startIcon={<ReleaseIcon {...release} />}
        size={'large'}
        onClick={onClick}
      >
        {downloadLabel(release)}
      </Button>
    </Box>
  );
};

interface ChooseDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

/** A dialog that allows users to select and download different versions of Lyricistant. */
export const ChooseDownloadDialog = (props: ChooseDownloadDialogProps) => {
  const handleReleaseClicked = (url: string) => {
    logger.info(`App download link clicked. Chosen URL: ${url}`);
    window.open(url, '_blank');
    props.onClose();
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
      onClose={props.onClose}
      aria-labelledby="choose-download-dialog-title"
      open={props.open}
    >
      <DialogTitle id="choose-download-dialog-title">
        Download Lyricistant
      </DialogTitle>
      <Box paddingLeft={'16px'} paddingRight={'16px'} paddingBottom={'32px'}>
        <Grid
          container
          spacing={1}
          alignItems={'center'}
          justifyContent={'center'}
        >
          {[...releases.keys()].map((platform) => (
            <PlatformDownloadOptions
              key={platform}
              platform={platform}
              releases={releases.get(platform)}
              onClick={(release) =>
                handleReleaseClicked(
                  release.url ?? latestReleaseUrl + release.asset
                )
              }
            />
          ))}
        </Grid>
      </Box>
      <Button
        size={'large'}
        variant={'contained'}
        fullWidth
        onClick={props.onClose}
      >
        Close
      </Button>
    </Dialog>
  );
};

const ReleaseIcon = ({ platform }: { platform: string }) => {
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
