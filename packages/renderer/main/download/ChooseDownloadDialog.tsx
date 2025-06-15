import { Release, supportedReleases } from '@lyricistant/renderer/download';
import { latestReleaseMachine } from '@lyricistant/renderer/download/LatestReleaseMachine';
import { APP_VERSION } from '@lyricistant/renderer/globals';
import { Android } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
} from '@mui/material';
import { useMachine } from '@xstate/react';
import { Apple, AppleIos, Linux, MicrosoftWindows } from 'mdi-material-ui';
import React, { useCallback, useEffect, useMemo } from 'react';

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
          sx={{ xs: 6 }}
        >
          <DownloadButton
            release={release}
            onClick={() => {
              props.onClick(release);
            }}
          />
        </Grid>
      )),
    [props.releases, props.onClick],
  );

  if (props.releases.length > 1) {
    return (
      <Grid
        container
        sx={{ xs: 12 }}
        spacing={1}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Grid sx={{ xs: 12 }}>
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

  return (
    <Box padding={'8px'}>
      <Button
        sx={{
          background: releaseColor(release),
          color: releaseTextColor(release),
          textTransform: 'none',
        }}
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
  const [state, send] = useMachine(latestReleaseMachine);

  useEffect(() => {
    if (props.open) {
      send({ type: 'INPUT', currentVersion: APP_VERSION });
    }
  }, [props.open]);

  const onReleaseClicked = useCallback(
    (release: Release) => {
      const url =
        release.url ??
        state.context.releaseData.baseDownloadUrl + release.asset;
      logger.info(`App download link clicked. Chosen URL: ${url}`);
      window.open(url, '_blank');
      props.onClose();
    },
    [state.context.releaseData?.baseDownloadUrl],
  );

  const releases = useMemo(
    () =>
      supportedReleases.reduce((map, release) => {
        const list = map.get(release.platform) ?? [];
        map.set(release.platform, [...list, release]);
        return map;
      }, new Map<string, Release[]>()),
    [],
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
      <DialogContent>
        {state.matches('loading') && (
          <Box display={'flex'} alignItems={'center'} justifyContent={'center'}>
            <CircularProgress size={'64px'} variant={'indeterminate'} />
          </Box>
        )}
        {state.matches('loaded') && (
          <DownloadButtons
            releases={releases}
            onReleaseClicked={onReleaseClicked}
          />
        )}
        {state.matches('error') && (
          <DialogContentText>
            Failed to fetch latest download information. Please try again later.
          </DialogContentText>
        )}
      </DialogContent>
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

const DownloadButtons = (props: {
  releases: Map<string, Release[]>;
  onReleaseClicked: (release: Release) => void;
}) => (
  <Grid container spacing={1} alignItems={'center'} justifyContent={'center'}>
    {[...props.releases.keys()].map((platform) => (
      <PlatformDownloadOptions
        key={platform}
        platform={platform}
        releases={props.releases.get(platform)}
        onClick={(release) => props.onReleaseClicked(release)}
      />
    ))}
  </Grid>
);

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
