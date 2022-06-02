import {
  ColorScheme as LyricistantTheme,
  ColorScheme,
  DefaultFileType,
  Font,
  RhymeSource,
} from '@lyricistant/common/preferences/PreferencesData';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import {
  Close as CloseIcon,
  Info,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  FormControl,
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
import React, { useEffect, useState } from 'react';

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
    <div>
      <Typography className={classes.header} variant={'h6'}>
        {label}
      </Typography>
      <Divider className={classes.divider} />
    </div>
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

/** The props needed to render {@link Preferences}. */
interface PreferencesProps {
  /** Whether the preferences dialog should show or not. */
  open: boolean;
  /** Invoked when the user closes the preferences dialog. */
  onClose: () => void;
  /** Invoked when the users wants to go to the About screen. */
  onAboutClicked: () => void;
}

/**
 * A dialog that allows users to view and edit their preferences. Also allows
 * them to link to the About screen.
 *
 * @param props The props needed to render this component.
 */
export const Preferences = (props: PreferencesProps) => {
  const classes = dialogStyles(undefined);
  const [originalPreferenceData] = useChannelData('prefs-updated', [
    props.open,
  ]);
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

  const onDefaultFileTypeChanged = (defaultFileType: DefaultFileType) => {
    setPreferencesData({
      ...preferencesData,
      defaultFileType,
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
        <Paper className={classes.paper}>
          <Box display={'flex'} flexDirection={'column'} gap={'24px'}>
            <Header label={'Display'} />

            <SelectBox
              value={preferencesData.font}
              onChange={onFontChanged}
              items={[
                { value: Font.Roboto_Mono, label: 'Roboto Monospace' },
                { value: Font.Roboto, label: 'Roboto' },
              ]}
              label={'Font'}
            />

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

            <Header label={'Other'} />

            <SelectBox
              value={preferencesData.rhymeSource}
              onChange={onRhymeSourceChanged}
              items={[
                { value: RhymeSource.Offline, label: 'Offline (alpha)' },
                { value: RhymeSource.Datamuse, label: 'Datamuse' },
              ]}
              label={'Rhyme Source'}
            />

            <SelectBox
              value={preferencesData.defaultFileType}
              onChange={onDefaultFileTypeChanged}
              items={[
                {
                  value: DefaultFileType.Always_Ask,
                  label: 'Always Ask',
                },
                {
                  value: DefaultFileType.Lyricistant_Lyrics,
                  label: 'Lyricistant file (.lyrics)',
                },
                {
                  value: DefaultFileType.Plain_Text,
                  label: 'Plain Text (.txt)',
                },
              ]}
              label={'Default File Type'}
            />
            <Button
              variant={'text'}
              startIcon={<Info />}
              size={'large'}
              onClick={props.onAboutClicked}
              sx={{ flexGrow: 1 }}
            >
              About Lyricistant
            </Button>
          </Box>
        </Paper>
      </Container>
    </Dialog>
  );
};
