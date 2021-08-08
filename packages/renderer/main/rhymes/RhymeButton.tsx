import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { isDevelopment } from '@lyricistant/common/BuildModes';
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
  <Box
    width={width}
    height={height}
    display={'flex'}
    flex={'none'}
    alignContent={'stretch'}
    onClick={onClick}
  >
    <ListItem
      className={className}
      button
      key={rhyme.word ?? ''}
      style={{ height: '100%' }}
    >
      <ListItemText
        primary={rhyme.word ?? ''}
        primaryTypographyProps={{ align: 'center' }}
        secondary={isDevelopment && rhyme.score}
      />
    </ListItem>
  </Box>
);
