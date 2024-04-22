import { DetailPaneChildProps } from '@lyricistant/renderer/detail/DetailPane';
import { NullStateText } from '@lyricistant/renderer/detail/NullStateText';
import { WordChip } from '@lyricistant/renderer/detail/WordChip';
import { RhymesState } from '@lyricistant/renderer/rhymes/RhymesMachine';
import { Box, Chip } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { Rhyme } from './rhyme';

interface RhymesListProps {
  rhymes: Rhyme[];
  onRhymeClicked: (rhyme: Rhyme) => void;
}

const RhymesListItem = ({
  rhyme,
  onRhymeClicked,
}: {
  rhyme: Rhyme;
  onRhymeClicked: (rhyme: Rhyme) => void;
}) => {
  const onClick = useCallback(() => {
    onRhymeClicked(rhyme);
  }, [rhyme, onRhymeClicked]);
  return <WordChip word={rhyme.word} key={rhyme.word} onClick={onClick} />;
};
const RhymesList = React.memo(({ rhymes, onRhymeClicked }: RhymesListProps) => (
  <Box
    display={rhymes.length > 0 ? 'flex' : 'none'}
    flexWrap={'wrap'}
    gap={'4px'}
    alignContent={'start'}
    flexDirection={'row'}
    paddingLeft={'16px'}
    paddingRight={'16px'}
  >
    {rhymes.map((rhyme) => (
      <RhymesListItem
        rhyme={rhyme}
        key={rhyme.word}
        onRhymeClicked={onRhymeClicked}
      />
    ))}
  </Box>
));

/** The props needed to render the {@link Rhymes} component. */
export interface RhymesProps extends DetailPaneChildProps {
  state: RhymesState;
  isSurpriseButtonEnabled: boolean;
  /**
   * Invoked when a rhyme is clicked.
   *
   * @param rhyme The rhyme that was clicked.
   */
  onRhymeClicked: (rhyme: Rhyme) => void;
  onSurpriseMeClicked: () => void;
}

/**
 * Given a query, fetches and renders a list of rhymes that can be clicked by a user.
 *
 * @param props The props needed to render this component.
 */
export const Rhymes: React.FC<RhymesProps> = (props) => {
  const state = props.state;

  const handleError = useErrorHandler();

  useEffect(() => {
    if (state.matches('error')) {
      handleError(state.context.error);
    }
  }, [handleError, state]);

  useEffect(() => {
    props.onLoadingChanged?.(state.matches('loading'));
  }, [state.matches('loading')]);

  const rhymes: Rhyme[] = state.context.rhymes;

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      gap={'8px'}
      height={'100%'}
      width={'100%'}
    >
      <NullStateText
        visible={state.matches('inactive')}
        text={'Waiting for lyrics'}
      />

      <NullStateText
        visible={state.matches('no-results')}
        text={'No rhymes found'}
      />

      <RhymesList rhymes={rhymes} onRhymeClicked={props.onRhymeClicked} />
      {props.isSurpriseButtonEnabled && (
        <>
          <Box flex={'1 1 auto'} />
          <Box
            paddingLeft={'32px'}
            paddingRight={'32px'}
            width={'100%'}
            display={'flex'}
          >
            <Chip
              sx={{ flex: '1 1 auto' }}
              label={'Surprise me'}
              onClick={props.onSurpriseMeClicked}
              variant={'outlined'}
              color={'primary'}
            />
          </Box>
        </>
      )}
    </Box>
  );
};
