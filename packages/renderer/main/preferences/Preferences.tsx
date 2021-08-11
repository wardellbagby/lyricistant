import {
  Font,
  RhymeSource,
  ColorScheme as LyricistantTheme,
  ColorScheme,
} from '@lyricistant/common/preferences/PreferencesData';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
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
import { platformDelegate } from '@lyricistant/renderer/globals';
import { usePreferences } from './PreferencesStore';

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
    root: {
      color: theme.palette.primary.contrastText,
    },
    container: {
      height: '100%',
    },
    divider: {
      marginTop: '2px',
    },
    dialogPaper: {
      background: theme.palette.background.default,
    },
    paper: {
      height: '100%',
      paddingTop: '32px',
      paddingBottom: '32px',
      paddingLeft: '32px',
      paddingRight: '32px',
    },
    header: {
      fontWeight: 'bolder',
    },
    select: {
      marginLeft: '16px',
      marginRight: '16px',
    },
  })
);

const Header = ({ label }: { label: string }) => {
  const classes = dialogStyles(undefined);
  return (
    <>
      <Typography className={classes.header} variant={'h6'}>
        {label}
      </Typography>
      <Divider className={classes.divider} />
    </>
  );
};

interface LabeledValue<T> {
  label: string;
  value: T;
}
interface SelectBoxProps<T> {
  value: T;
  onChange: (value: T) => void;
  items: Array<LabeledValue<T>>;
  label: string;
}
const SelectBox = <T extends string | number>({
  value,
  onChange,
  items,
  label,
}: SelectBoxProps<T>) => {
  const classes = dialogStyles(undefined);
  return (
    <FormControl variant="outlined" fullWidth>
      <InputLabel className={classes.select}>{label}</InputLabel>
      <Select
        className={classes.select}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        label={label}
      >
        {items.map(({ label: itemLabel, value: itemValue }) => (
          <MenuItem key={itemLabel} value={itemValue}>
            {itemLabel}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

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

  const onDetailsSizeChanged = (textSize: number) => {
    setPreferencesData({
      ...preferencesData,
      textSize,
    });
  };

  const onColorSchemeChanged = (colorScheme: ColorScheme) => {
    setPreferencesData({
      ...preferencesData,
      colorScheme,
    });
  };

  const onRhymeSourceChanged = (rhymeSource: RhymeSource) => {
    setPreferencesData({
      ...preferencesData,
      rhymeSource,
    });
  };

  const onFontChanged = (font: Font) => {
    setPreferencesData({
      ...preferencesData,
      font,
    });
  };

  const onPreferencesSaved = () => {
    platformDelegate.send('save-prefs', preferencesData);
    closePreferences();
  };

  const closePreferences = () => history.replace('/');

  const onAboutClicked = () => history.replace('/about');

  if (!preferencesData) {
    return <div />;
  }

  return (
    <Dialog
      fullScreen
      className={classes.root}
      open
      TransitionComponent={DialogTransition}
      PaperProps={{ className: classes.dialogPaper }}
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
      <Container maxWidth={'md'} className={classes.container}>
        <Paper elevation={4} square className={classes.paper}>
          <Box display={'flex'} flexDirection={'column'} height={'100%'}>
            <Box flexGrow={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Header label={'Display'} />
                </Grid>
                <Grid item xs={12}>
                  <SelectBox
                    value={preferencesData.font}
                    onChange={onFontChanged}
                    items={[
                      { value: Font.Roboto_Mono, label: 'Roboto Monospace' },
                      { value: Font.Roboto, label: 'Roboto' },
                    ]}
                    label={'Font'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <SelectBox
                    value={preferencesData.textSize}
                    onChange={onDetailsSizeChanged}
                    items={[
                      { value: 8, label: 'Tiny' },
                      { value: 12, label: 'Small' },
                      { value: 16, label: 'Default' },
                      { value: 24, label: 'Large' },
                      { value: 28, label: 'Huge' },
                    ]}
                    label={'Text Size'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <SelectBox
                    value={preferencesData.colorScheme}
                    onChange={onColorSchemeChanged}
                    items={[
                      { value: LyricistantTheme.Light, label: 'Light' },
                      { value: LyricistantTheme.Dark, label: 'Dark' },
                      {
                        value: LyricistantTheme.System,
                        label: 'Use Device Color Scheme',
                      },
                    ]}
                    label={'Color Scheme'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Header label={'Other'} />
                </Grid>
                <Grid item xs={12}>
                  <SelectBox
                    value={preferencesData.rhymeSource}
                    onChange={onRhymeSourceChanged}
                    items={[
                      { value: RhymeSource.Offline, label: 'Offline (alpha)' },
                      { value: RhymeSource.Datamuse, label: 'Datamuse' },
                    ]}
                    label={'Rhyme Source'}
                  />
                </Grid>
              </Grid>
            </Box>
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
        </Paper>
      </Container>
    </Dialog>
  );
};
