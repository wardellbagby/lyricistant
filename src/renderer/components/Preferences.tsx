import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Dialog from '@material-ui/core/Dialog';
import FormLabel from '@material-ui/core/FormLabel';
import GridList from '@material-ui/core/GridList';
import IconButton from '@material-ui/core/IconButton';
import Slide from '@material-ui/core/Slide';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import { TransitionProps } from '@material-ui/core/transitions/transition';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { PreferencesData } from 'common/preferences/PreferencesData';
import React, { FunctionComponent, useEffect, useState } from 'react';

export interface PreferencesProps {
  show: boolean;
  data: PreferencesData;
  onPreferencesSaved: (data: PreferencesData) => void;
  onClosed: () => void;
}

const DialogTransition = React.forwardRef<unknown, TransitionProps>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);
const dialogStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      marginLeft: theme.spacing(2),
      flex: 1
    },
    dialog: {
      background: theme.palette.primary.dark
    },
    container: {
      background: theme.palette.background.paper
    }
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
    event: React.MouseEvent<HTMLElement>,
    value: number | undefined
  ) => {
    if (value) {
      setPreferencesData({
        ...preferencesData,
        textSize: value
      });
    }
  };

  if (!props.show && !preferencesData) {
    return <div></div>;
  }

  return (
    <Dialog
      fullScreen
      open={props.show}
      TransitionComponent={DialogTransition}
      className={classes.dialog}
    >
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
      <Container maxWidth="md">
        <Box py={2}>
          <GridList cols={1} cellHeight="auto" spacing={8}>
            <FormLabel>Text Size</FormLabel>
            <ToggleButtonGroup
              value={preferencesData.textSize}
              onChange={onDetailsSizeChanged}
              exclusive
            >
              <ToggleButton value={8}>Tiny</ToggleButton>
              <ToggleButton value={12}>Small</ToggleButton>
              <ToggleButton value={16}>Medium</ToggleButton>
              <ToggleButton value={24}>Large</ToggleButton>
              <ToggleButton value={28}>Huge</ToggleButton>
            </ToggleButtonGroup>
          </GridList>
        </Box>
      </Container>
    </Dialog>
  );
};
