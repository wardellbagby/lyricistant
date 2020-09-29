import {
  Box,
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
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';
import {
  PreferencesData,
  Theme as LyricistantTheme,
} from 'common/preferences/PreferencesData';
import React, { FunctionComponent, useEffect, useState } from 'react';

export interface PreferencesProps {
  show: boolean;
  data: PreferencesData;
  onPreferencesSaved: (data: PreferencesData) => void;
  onClosed: () => void;
}

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
  })
);

export const Preferences: FunctionComponent<PreferencesProps> = (
  props: PreferencesProps
) => {
  const classes = dialogStyles(undefined);
  const [preferencesData, setPreferencesData] = useState(props.data);

  useEffect(() => {
    if (!preferencesData) {
      setPreferencesData(props.data);
    }
  }, [props.data]);

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

  if (!props.show && !preferencesData) {
    return <div />;
  }

  return (
    <Dialog fullScreen open={props.show} TransitionComponent={DialogTransition}>
      <AppBar color={'primary'} position="sticky">
        <Toolbar>
          <IconButton edge="start" onClick={props.onClosed}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Preferences
          </Typography>
          <IconButton onClick={() => props.onPreferencesSaved(preferencesData)}>
            <SaveIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box py={'32px'} px={'64px'}>
        <Grid container spacing={3}>
          <Grid item sm={12} md={6}>
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
          <Grid item sm={12} md={6}>
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
      </Box>
    </Dialog>
  );
};
