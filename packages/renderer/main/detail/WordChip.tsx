import { Chip } from '@mui/material';
import React from 'react';

/** The props needed to render {@link WordChip} */
interface WordChipProps {
  /** The word to display. */
  word: string;
  /** Invoked when this button is clicked. */
  onClick: () => void;
}

/**
 * A "chip" that displays a word that can be clicked.
 *
 * @param props The props needed to render {@link WordChip}
 */
export const WordChip = ({ word, onClick }: WordChipProps) => (
  <Chip sx={{ flex: '1 1 auto' }} onClick={onClick} label={word} />
);
