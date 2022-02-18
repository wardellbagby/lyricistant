import {
  ColorScheme as LyricistantTheme,
  ColorScheme,
  Font,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slide,
  SlideProps,
  Theme,
  Toolbar,
  Typography,
} from '@mui/material';
import { createStyles, makeStyles } from '@mui/styles';
import {
  Close as CloseIcon,
  Info,
  Save as SaveIcon,
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';

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

interface PreferencesProps {
  open: boolean;
  onClose: () => void;
  onAboutClicked: () => void;
}

export const Preferences = (props: PreferencesProps) => {
  const classes = dialogStyles(undefined);
  const [originalPreferenceData] = useChannelData('prefs-updated');
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
    props.onClose();
  };

  if (!preferencesData) {
    return <div />;
  }

  return (
    <Dialog
      fullScreen
      className={classes.root}
      open={props.open}
      TransitionComponent={DialogTransition}
      PaperProps={{ className: classes.dialogPaper }}
    >
      <AppBar color={'primary'} position="sticky" enableColorOnDark>
        <Toolbar>
          <IconButton
            color={'inherit'}
            edge="start"
            onClick={props.onClose}
            size="large"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Preferences
          </Typography>
          <IconButton
            color={'inherit'}
            onClick={onPreferencesSaved}
            size="large"
          >
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
                      { value: 8, label: '8' },
                      { value: 12, label: '12' },
                      { value: 16, label: '16 (Default)' },
                      { value: 20, label: '20' },
                      { value: 24, label: '24' },
                      { value: 28, label: '28' },
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
              onClick={props.onAboutClicked}
            >
              About Lyricistant
            </Button>
          </Box>
        </Paper>
      </Container>
    </Dialog>
  );
};
