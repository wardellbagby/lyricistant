import { DialogTitle, Drawer } from '@material-ui/core';
import React from 'react';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { makeStyles } from '@material-ui/core/styles';
import { RhymeButton } from '@lyricistant/renderer/rhymes/RhymeButton';

const useStyles = makeStyles((theme) => ({
  drawer: {
    display: 'flex',
    alignItems: 'center',
    maxHeight: '50%',
    color: theme.palette.text.primary,
  },
  rhymes: {
    'text-align': 'center',
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
  const classes = useStyles();

  return (
    <>
      <Drawer
        anchor={'bottom'}
        open={true}
        PaperProps={{
          className: classes.drawer,
        }}
        onClose={onClose}
      >
        <DialogTitle>{query}</DialogTitle>
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
      </Drawer>
    </>
  );
};
