import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { Chip } from '@mui/material';
import React from 'react';

/** The props needed to render {@link RhymeButton} */
interface RhymeButtonProps {
  /** The rhyme to display. */
  rhyme: Rhyme;
  /** Invoked when this button is clicked. */
  onClick: () => void;
}

/**
 * A button that displays a rhyme.
 *
 * @param props The props needed to render {@link RhymeButton}
 */
export const RhymeButton = ({ rhyme, onClick }: RhymeButtonProps) => (
  <Chip onClick={onClick} label={rhyme.word} />
);
