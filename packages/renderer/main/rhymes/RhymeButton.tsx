import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { ListItem, ListItemText } from '@mui/material';
import React from 'react';

/** The props needed to render {@link RhymeButton} */
interface RhymeButtonProps {
  /** The rhyme to display. */
  rhyme: Rhyme;
  /** The CSS class name to give this component. */
  className: string;
  /** Invoked when this button is clicked. */
  onClick: () => void;
  /** The height of the button. */
  height: number | string;
  /** The width of the button. */
  width: number | string;
}

/**
 * A button that displays a rhyme.
 *
 * @param props The props needed to render {@link RhymeButton}
 */
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
