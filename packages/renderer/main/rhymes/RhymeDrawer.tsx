import { Drawer, Theme, Typography } from '@material-ui/core';
import React from 'react';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { makeStyles } from '@material-ui/core/styles';
import { RhymeButton } from '@lyricistant/renderer/rhymes/RhymeButton';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';

const useStyles = makeStyles<Theme, { isSmallLayout: boolean }>((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paper: {
    display: 'flex',
    alignItems: 'center',
    maxHeight: ({ isSmallLayout }) => (isSmallLayout ? '50%' : '70%'),
    width: '100%',
    maxWidth: '600px',
    color: theme.palette.text.primary,
    top: 'unset',
    bottom: 'unset',
    right: 'unset',
    left: 'unset',
    overflow: 'hidden',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  rhymeContainer: {
    overflow: 'overlay',
    width: '100%',
  },
  header: {
    width: '100%',
    background: theme.palette.background.paper,
    zIndex: 10,
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    padding: '16px',
    'border-bottom': `1px solid ${theme.palette.divider}`,
  },
  rhymes: {
    textAlign: 'center',
    overflow: 'hidden',
    '&:hover': {
      background: theme.palette.text.disabled,
    },
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      bottom: '0',
      width: '30%',
      left: '35%',
      'border-bottom': `1px solid ${theme.palette.divider}`,
    },
  },
}));

interface RhymeDrawerProps {
  onClose: () => void;
  rhymes: Rhyme[];
  query: string;
  onRhymeClicked: (rhyme: Rhyme) => void;
}

export const RhymeDrawer = ({
  rhymes,
  onClose,
  onRhymeClicked,
  query,
}: RhymeDrawerProps) => {
  const classes = useStyles({ isSmallLayout: useSmallLayout() });

  return (
    <Drawer
      open={true}
      PaperProps={{
        className: classes.paper,
      }}
      onClose={onClose}
      classes={{
        root: classes.root,
      }}
    >
      <Typography className={classes.header} variant={'h6'}>
        {query}
      </Typography>
      <div className={classes.rhymeContainer}>
        {rhymes.map((rhyme) => (
          <RhymeButton
            rhyme={rhyme}
            key={rhyme.word}
            className={classes.rhymes}
            height={80}
            width={'100%'}
            onClick={() => onRhymeClicked(rhyme)}
          />
        ))}
      </div>
    </Drawer>
  );
};
