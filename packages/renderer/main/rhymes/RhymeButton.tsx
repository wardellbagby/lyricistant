import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { ListItem, ListItemText } from '@mui/material';
import React from 'react';

interface RhymeButtonProps {
  rhyme: Rhyme;
  className: string;
  onClick: () => void;
  height: number | string;
  width: number | string;
}

export const RhymeButton = ({
  rhyme,
  className,
  onClick,
  width,
  height,
}: RhymeButtonProps) => (
  <ListItem
    className={className}
    button
    style={{ width, height }}
    onClick={onClick}
  >
    <ListItemText
      primary={rhyme.word ?? ''}
      primaryTypographyProps={{ align: 'center' }}
    />
  </ListItem>
);
