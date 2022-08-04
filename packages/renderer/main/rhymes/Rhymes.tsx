import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { ReactComponent as Feather } from '@lyricistant/renderer/lyricistant_feather.svg';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { RhymeButton } from '@lyricistant/renderer/rhymes/RhymeButton';
import { rhymesMachine } from '@lyricistant/renderer/rhymes/RhymesMachine';
import {
  Box,
  LinearProgress,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useMachine } from '@xstate/react';
import React, { useEffect, useLayoutEffect } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { Rhyme } from './rhyme';

interface RhymesListProps {
  rhymes: Rhyme[];
  onRhymeClicked: (rhyme: Rhyme) => void;
}

const RhymesList = ({ rhymes, onRhymeClicked }: RhymesListProps) => (
  <Box
    display={'flex'}
    flexWrap={'wrap'}
    gap={'4px'}
    height={'100%'}
    width={'100%'}
    alignContent={'start'}
    flexDirection={'row'}
    overflow={'auto'}
  >
    {rhymes.map((rhyme) => (
      <RhymeButton
        rhyme={rhyme}
        key={rhyme.word}
        onClick={() => onRhymeClicked(rhyme)}
      />
    ))}
  </Box>
);

const useLoadingIndicatorStyles = makeStyles<Theme, { display: boolean }>(
  (theme: Theme) => ({
    root: {
      visibility: ({ display }) => (display ? 'visible' : 'hidden'),
    },
    progressBarColor: {
      backgroundColor: theme.palette.action.disabled,
    },
    progressBarBackground: {
      backgroundColor: '#00000000',
    },
  })
);
const LoadingIndicator = (props: { display: boolean }) => {
  const classes = useLoadingIndicatorStyles(props);
  return (
    <LinearProgress
      className={classes.root}
      classes={{
        colorPrimary: classes.progressBarBackground,
        barColorPrimary: classes.progressBarColor,
      }}
    />
  );
};

const useInactiveHelperTextStyles = makeStyles((theme: Theme) => ({
  root: {
    color: theme.palette.text.disabled,
  },
}));
const HelperText = ({ text }: { text: string }) => {
  const classes = useInactiveHelperTextStyles();
  const theme = useTheme();
  const isSmallLayout = useSmallLayout();

  return (
    <Box
      height={'100%'}
      width={'100%'}
      overflow={'hidden'}
      textOverflow={'ellipsis'}
      fontStyle={'italic'}
      p={'16px'}
      display={'flex'}
      flexWrap={'wrap-reverse'}
      gap={'12px'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
    >
      {!isSmallLayout && (
        <Feather
          height={'64px'}
          width={'64px'}
          fill={theme.palette.text.disabled}
          viewBox={'0 0 100 100'}
        />
      )}
      <Typography className={classes.root} variant={'body1'}>
        {text}
      </Typography>
    </Box>
  );
};

/** The props needed to render the {@link Rhymes} component. */
export interface RhymesProps {
  /** The query to find rhymes for. */
  query?: string;
  /**
   * Invoked when a rhyme is clicked.
   *
   * @param rhyme The rhyme that was clicked.
   */
  onRhymeClicked: (rhyme: Rhyme) => void;
}

/**
 * Given a query, fetches and renders a list of rhymes that can be clicked by a user.
 *
 * @param props The props needed to render this component.
 */
export const Rhymes: React.FC<RhymesProps> = (props) => {
  const [state, send] = useMachine(rhymesMachine);

  const handleError = useErrorHandler();

  const [preferences] = useChannelData('prefs-updated');

  useLayoutEffect(() => {
    if (!props.query || !preferences) {
      return;
    }
    send({
      type: 'INPUT',
      input: props.query,
      rhymeSource: preferences.rhymeSource,
    });
  }, [props.query, preferences]);

  useEffect(() => {
    if (state.matches('error')) {
      handleError(state.context.error);
    }
  }, [handleError, state]);

  const rhymes: Rhyme[] = state.context.rhymes;

  return (
    <Box display={'flex'} flexDirection={'column'} height={'100%'}>
      <LoadingIndicator display={state.matches('loading')} />

      {state.matches('inactive') && <HelperText text={'Waiting for lyrics'} />}

      {state.matches('no-results') && <HelperText text={'No rhymes found'} />}

      {rhymes.length > 0 && (
        <RhymesList rhymes={rhymes} onRhymeClicked={props.onRhymeClicked} />
      )}
    </Box>
  );
};
