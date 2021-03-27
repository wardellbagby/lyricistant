import { Theme as LyricistantTheme } from '@lyricistant/common/preferences/PreferencesData';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slide,
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import { SlideProps } from '@material-ui/core/Slide';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { Info } from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { platformDelegate } from '../globals';
import { usePreferences } from '../stores/PreferencesStore';

const DialogTransition = React.forwardRef<unknown, SlideProps>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);
const dialogStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    },
    appBar: {
      color: theme.palette.primary.contrastText,
    },
  })
);

export const Preferences = () => {
  const history = useHistory();
  const classes = dialogStyles(undefined);
  const originalPreferenceData = usePreferences();
  const [preferencesData, setPreferencesData] = useState(
    originalPreferenceData
  );

  useEffect(() => {
    setPreferencesData(originalPreferenceData);
  }, [originalPreferenceData]);

  const onDetailsSizeChanged = (
    event: React.ChangeEvent<{ value: number }>
  ) => {
    if (event.target.value) {
      setPreferencesData({
        ...preferencesData,
        textSize: event.target.value,
      });
    }
  };

  const onThemeChanged = (
    event: React.ChangeEvent<{ value: LyricistantTheme }>
  ) => {
    if (event.target.value !== undefined) {
      setPreferencesData({
        ...preferencesData,
        theme: event.target.value,
      });
    }
  };

  const onPreferencesSaved = () =>
    platformDelegate.send('save-prefs', preferencesData);

  const closePreferences = () => history.replace('/');

  const onAboutClicked = () => history.replace('/about');

  if (!preferencesData) {
    return <div />;
  }

  return (
    <Dialog
      fullScreen
      className={classes.appBar}
      open
      TransitionComponent={DialogTransition}
    >
      <AppBar color={'primary'} position="sticky">
        <Toolbar>
          <IconButton color={'inherit'} edge="start" onClick={closePreferences}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Preferences
          </Typography>
          <IconButton color={'inherit'} onClick={onPreferencesSaved}>
            <SaveIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        py={'32px'}
        px={'64px'}
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        height={'100%'}
        width={'100%'}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel id="text-size-label">Text Size</InputLabel>
              <Select
                labelId="text-size-label"
                value={preferencesData.textSize}
                onChange={onDetailsSizeChanged}
                label="Text Size"
              >
                <MenuItem value={8}>Tiny</MenuItem>
                <MenuItem value={12}>Small</MenuItem>
                <MenuItem value={16}>Default</MenuItem>
                <MenuItem value={24}>Large</MenuItem>
                <MenuItem value={28}>Huge</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel id="theme-label">Theme</InputLabel>
              <Select
                labelId="theme-label"
                value={preferencesData.theme}
                onChange={onThemeChanged}
                label="Theme"
              >
                <MenuItem value={LyricistantTheme.Light}>Light</MenuItem>
                <MenuItem value={LyricistantTheme.Dark}>Dark</MenuItem>
                <MenuItem value={LyricistantTheme.System}>
                  Follow System
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box flexGrow={'1'} />
        <Button
          fullWidth={false}
          variant={'text'}
          startIcon={<Info />}
          size={'large'}
          onClick={onAboutClicked}
        >
          About Lyricistant
        </Button>
      </Box>
    </Dialog>
  );
};
