import { DetailPaneChildProps } from '@lyricistant/renderer/detail/DetailPane';
import { ListSpacer } from '@lyricistant/renderer/detail/ListSpacer';
import { NullStateText } from '@lyricistant/renderer/detail/NullStateText';
import { WordChip } from '@lyricistant/renderer/detail/WordChip';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
import { rhymesMachine } from '@lyricistant/renderer/rhymes/RhymesMachine';
import { Box } from '@mui/material';
import { useMachine } from '@xstate/react';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
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
    overflow={'auto'}
    paddingLeft={'16px'}
    paddingRight={'16px'}
  >
    <ListSpacer />
    {rhymes.map((rhyme) => (
      <RhymesListItem
        rhyme={rhyme}
        key={rhyme.word}
        onRhymeClicked={onRhymeClicked}
      />
    ))}
    <ListSpacer />
  </Box>
));

/** The props needed to render the {@link Rhymes} component. */
export interface RhymesProps extends DetailPaneChildProps {
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
    if (!props.isVisible || !props.query || !preferences) {
      return;
    }
    send({
      type: 'INPUT',
      input: props.query,
      rhymeSource: preferences.rhymeSource,
    });
  }, [props.query, props.isVisible, preferences]);

  useEffect(() => {
    if (state.matches('error')) {
      handleError(state.context.error);
    }
  }, [handleError, state]);

  useEffect(() => {
    props.onLoadingChanged?.(state.matches('loading.active'));
  }, [state.matches('loading.active')]);

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
    </Box>
  );
};
