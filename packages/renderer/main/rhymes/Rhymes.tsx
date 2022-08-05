import { LoadingIndicator } from '@lyricistant/renderer/detail/LoadingIndicator';
import { NullStateText } from '@lyricistant/renderer/detail/NullStateText';
import { WordChip } from '@lyricistant/renderer/detail/WordChip';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { rhymesMachine } from '@lyricistant/renderer/rhymes/RhymesMachine';
import { Box } from '@mui/material';
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
    alignContent={'start'}
    flexDirection={'row'}
    overflow={'auto'}
    paddingLeft={'16px'}
    paddingRight={'16px'}
  >
    {rhymes.map((rhyme) => (
      <WordChip
        word={rhyme.word}
        key={rhyme.word}
        onClick={() => onRhymeClicked(rhyme)}
      />
    ))}
  </Box>
);

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
    <Box
      display={'flex'}
      flexDirection={'column'}
      gap={'8px'}
      height={'100%'}
      width={'100%'}
    >
      <LoadingIndicator display={state.matches('loading.active')} />

      {state.matches('inactive') && (
        <NullStateText text={'Waiting for lyrics'} />
      )}

      {state.matches('no-results') && (
        <NullStateText text={'No rhymes found'} />
      )}

      {rhymes.length > 0 && (
        <RhymesList rhymes={rhymes} onRhymeClicked={props.onRhymeClicked} />
      )}
    </Box>
  );
};
