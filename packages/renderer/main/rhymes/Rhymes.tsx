import Box from '@material-ui/core/Box';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React, {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { usePreferences } from '@lyricistant/renderer/preferences/PreferencesStore';
import { useMachine } from '@xstate/react';
import { rhymesMachine } from '@lyricistant/renderer/rhymes/RhymesMachine';
import {
  IconButton,
  LinearProgress,
  Typography,
  useTheme,
} from '@material-ui/core';
import {
  useSelectedWordPosition,
  useSelectedWords,
  useSelectedWordStore,
} from '@lyricistant/renderer/editor/SelectedWordStore';
import { ReactComponent as Feather } from '@lyricistant/renderer/lyricistant_feather.svg';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { DotsVertical } from 'mdi-material-ui';
import { FlexDirectionProperty } from 'csstype';
import useResizeObserver from 'use-resize-observer';
import { RhymeButton } from '@lyricistant/renderer/rhymes/RhymeButton';
import { RhymeDrawer } from '@lyricistant/renderer/rhymes/RhymeDrawer';
import { ExpandMore } from '@material-ui/icons';
import { Rhyme } from './rhyme';

const useRhymeListStyles = makeStyles<
  Theme,
  { listDirection: FlexDirectionProperty; isSmallLayout: boolean }
>((theme: Theme) => ({
  rhyme: {
    'text-align': 'center',
    overflow: 'hidden',
    '&:hover': {
      background: theme.palette.background.paper,
    },
  },
  listContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: ({ listDirection }) => listDirection,
    height: '100%',
    flexGrow: 1,
    width: '100%',
    overflow: 'hidden',
    color: theme.palette.text.disabled,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
}));

interface RhymesListProps {
  rhymes: Rhyme[];
  postItemComponent?: ReactNode;
  onRhymeClicked: (rhyme: Rhyme) => void;
  onMoreRhymes: (hasMoreRhymes: boolean) => void;
}

const RhymesList = ({
  rhymes,
  onRhymeClicked,
  onMoreRhymes,
  postItemComponent,
}: RhymesListProps) => {
  const isSmallLayout = useSmallLayout();
  const flexDirection = useMemo(
    () => (isSmallLayout ? 'row' : 'column'),
    [isSmallLayout]
  );

  const classes = useRhymeListStyles({
    listDirection: flexDirection,
    isSmallLayout,
  });
  const {
    ref,
    width: containerWidth = 0,
    height: containerHeight = 0,
  } = useResizeObserver<HTMLDivElement>();

  const rhymeHeight = useRhymeComponentHeight();
  const rhymeWidth = useRhymeComponentWidth();

  const children = useMemo(() => {
    let containerDimension;
    let rhymeDimension: number;

    if (isSmallLayout) {
      rhymeDimension = rhymeWidth as number;
      containerDimension = containerWidth;
    } else {
      rhymeDimension = rhymeHeight;
      containerDimension = containerHeight;
    }

    const displayableChildrenCount = Math.floor(
      (containerDimension - 1) / rhymeDimension
    );
    const displayableRhymes = [...rhymes];
    displayableRhymes.splice(Math.min(displayableChildrenCount, rhymes.length));

    return displayableRhymes.map((rhyme) => (
      <RhymeButton
        rhyme={rhyme}
        key={rhyme.word}
        height={rhymeHeight}
        width={rhymeWidth}
        className={classes.rhyme}
        onClick={() => onRhymeClicked(rhyme)}
      />
    ));
  }, [
    containerWidth,
    containerHeight,
    rhymeHeight,
    rhymeWidth,
    rhymes,
    isSmallLayout,
  ]);

  useEffect(() => {
    onMoreRhymes(rhymes.length > children.length);
  }, [onMoreRhymes, rhymes, children]);

  return (
    <Box
      display={'flex'}
      flexWrap={'nowrap'}
      height={!isSmallLayout ? '100%' : undefined}
      width={'100%'}
      flexDirection={flexDirection}
    >
      <div ref={ref} className={classes.listContainer}>
        {children}
      </div>
      {postItemComponent}
    </Box>
  );
};

const useLoadingIndicatorStyles = makeStyles<Theme, { display: boolean }>(
  (theme: Theme) => ({
    root: {
      visibility: ({ display }) => (display ? 'visible' : 'hidden'),
    },
    progressBarColor: {
      backgroundColor: theme.palette.text.secondary,
    },
    progressBarBackground: {
      backgroundColor: theme.palette.background.default,
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
      gridGap={'12px'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
    >
      <Feather
        height={'64px'}
        width={'64px'}
        fill={theme.palette.text.disabled}
        viewBox={'0 0 100 100'}
      />
      <Typography className={classes.root} variant={'body1'}>
        {text}
      </Typography>
    </Box>
  );
};

export const Rhymes: React.FC = () => {
  const [state, send] = useMachine(rhymesMachine);

  const selectedWordStore = useSelectedWordStore();
  const handleError = useErrorHandler();
  const selectedWord = useSelectedWords();
  const selectedWordPosition = useSelectedWordPosition();
  const [hasMoreRhymes, setHasMoreRhymes] = useState(false);
  const [showMoreRhymes, setShowMoreRhymes] = useState(false);

  const onRhymeClicked = useMemo(
    () => (rhyme: Rhyme) =>
      selectedWordStore.onWordReplaced({
        originalWord: {
          word: selectedWord,
          from: selectedWordPosition[0],
          to: selectedWordPosition[1],
        },
        newWord: rhyme.word,
      }),
    [selectedWord, selectedWordPosition]
  );

  const preferences = usePreferences();

  useLayoutEffect(() => {
    if (!selectedWord || !preferences) {
      return;
    }
    send({
      type: 'INPUT',
      input: selectedWord,
      rhymeSource: preferences.rhymeSource,
    });
  }, [selectedWord, preferences]);

  useEffect(() => {
    if (state.matches('error')) {
      handleError(state.context.error);
    }
  }, [handleError, state]);

  const rhymes: Rhyme[] = state.context.rhymes;

  return (
    <Box display={'flex'} flexDirection={'column'}>
      <LoadingIndicator display={state.matches('loading')} />

      {state.matches('inactive') && <HelperText text={'Waiting for lyrics'} />}

      {state.matches('no-results') && <HelperText text={'No rhymes found'} />}

      {rhymes.length > 0 && (
        <RhymesList
          rhymes={rhymes}
          onMoreRhymes={setHasMoreRhymes}
          postItemComponent={
            hasMoreRhymes &&
            rhymes.length > 0 && (
              <ShowAllButton
                onClick={() => {
                  setShowMoreRhymes(true);
                }}
              />
            )
          }
          onRhymeClicked={onRhymeClicked}
        />
      )}
      {showMoreRhymes && (
        <RhymeDrawer
          rhymes={rhymes}
          query={selectedWord}
          onClose={() => setShowMoreRhymes(false)}
          onRhymeClicked={(rhyme) => {
            setShowMoreRhymes(false);
            onRhymeClicked(rhyme);
          }}
        />
      )}
    </Box>
  );
};

const useShowAllButtonStyles = makeStyles((theme: Theme) => ({
  button: {
    color: theme.palette.text.disabled,
  },
}));
const ShowAllButton = ({ onClick }: { onClick: () => void }) => {
  const { button } = useShowAllButtonStyles();
  const isSmallLayout = useSmallLayout();

  return (
    <IconButton
      className={button}
      style={{ height: isSmallLayout ? '100%' : undefined }}
      onClick={onClick}
    >
      {isSmallLayout ? <DotsVertical /> : <ExpandMore />}
    </IconButton>
  );
};

const useRhymeComponentHeight = () => {
  if (useSmallLayout()) {
    return 50;
  } else {
    return 80;
  }
};

const useRhymeComponentWidth = () => {
  if (useSmallLayout()) {
    return 150;
  } else {
    return '100%';
  }
};
