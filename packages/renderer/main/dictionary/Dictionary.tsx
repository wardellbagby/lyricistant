import { DetailPaneChildProps } from '@lyricistant/renderer/detail/DetailPane';
import { ListSpacer } from '@lyricistant/renderer/detail/ListSpacer';
import { NullStateText } from '@lyricistant/renderer/detail/NullStateText';
import { WordChip } from '@lyricistant/renderer/detail/WordChip';
import {
  Definition,
  dictionaryMachine,
  Meaning,
} from '@lyricistant/renderer/dictionary/DictionaryMachine';
import { Box, Divider, Typography } from '@mui/material';
import { useMachine } from '@xstate/react';
import React, { useEffect, useMemo } from 'react';

export interface DictionaryProps extends DetailPaneChildProps {
  query?: string;
  onRelatedTextClicked: (text: string) => void;
}
export const Dictionary = ({
  query,
  onRelatedTextClicked,
  isVisible,
  onLoadingChanged,
}: DictionaryProps) => {
  const [state, send] = useMachine(dictionaryMachine);

  useEffect(() => {
    if (isVisible && query) {
      send({ type: 'INPUT', input: query });
    }
  }, [query, isVisible]);

  useEffect(() => {
    onLoadingChanged?.(state.matches('loading.active'));
  }, [state.matches('loading.active')]);

  const meanings: Meaning[] = state.context.result;

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      gap={'8px'}
      height={'100%'}
      width={'100%'}
    >
      <NullStateText
        visible={state.matches('waiting')}
        text={'Waiting for lyrics'}
      />

      {state.matches('no-results') && (
        <NullStateText
          visible={state.matches('no-results')}
          text={'No definition found'}
        />
      )}

      {meanings.length > 0 && (
        <MeaningList
          query={state.context.inputForResult}
          meanings={meanings}
          onRelatedTextClicked={onRelatedTextClicked}
        />
      )}
    </Box>
  );
};

const MeaningList = React.memo(
  (props: {
    query: string;
    meanings: Meaning[];
    onRelatedTextClicked: (word: string) => void;
  }) => (
    <Box sx={{ overflow: 'auto', paddingLeft: '16px', paddingRight: '16px' }}>
      <ListSpacer />
      <Typography variant={'h5'}>{props.query}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {props.meanings.map((meaning, index) => (
          <React.Fragment key={JSON.stringify(meaning)}>
            <VisualMeaning
              meaning={meaning}
              onRelatedTextClicked={props.onRelatedTextClicked}
            />
            {index < props.meanings.length - 1 && (
              <Divider variant={'fullWidth'} />
            )}
          </React.Fragment>
        ))}
      </Box>
      <ListSpacer />
    </Box>
  )
);

const VisualMeaning = (props: {
  meaning: Meaning;
  onRelatedTextClicked: (word: string) => void;
}) => (
  <Box display={'flex'} flexDirection={'column'} gap={'8px'}>
    <Typography variant={'subtitle1'} sx={{ fontWeight: 'bold' }}>
      {props.meaning.partOfSpeech}
    </Typography>
    {props.meaning.definitions.map((definition, index) => (
      <VisualDefinition
        key={index}
        definition={definition}
        onRelatedTextClicked={props.onRelatedTextClicked}
        showDivider={index < props.meaning.definitions.length - 1}
      />
    ))}
  </Box>
);

const VisualDefinition = ({
  definition,
  showDivider,
  onRelatedTextClicked,
}: {
  definition: Definition;
  showDivider: boolean;
  onRelatedTextClicked: (word: string) => void;
}) => {
  const hideRelatedWords = useMemo(
    () => !(definition.antonyms?.length > 0 || definition.synonyms?.length > 0),
    [definition]
  );
  return (
    <Box>
      <Typography>{definition.definition}</Typography>
      {definition.example?.trim()?.length > 0 && (
        <Typography variant={'body2'} sx={{ fontStyle: 'italic' }}>
          {definition.example}
        </Typography>
      )}
      <Box
        sx={{
          padding: '4px',
          display: hideRelatedWords ? 'none' : undefined,
        }}
      >
        {definition.synonyms?.length > 0 && (
          <RelatedText
            label={'Synonyms'}
            words={definition.synonyms}
            onRelatedTextClicked={onRelatedTextClicked}
          />
        )}
        {definition.antonyms?.length > 0 && (
          <RelatedText
            label={'Antonyms'}
            words={definition.antonyms}
            onRelatedTextClicked={onRelatedTextClicked}
          />
        )}
      </Box>
      {showDivider && (
        <Divider
          variant={'middle'}
          sx={{ paddingTop: '4px', paddingBottom: '4px' }}
        />
      )}
    </Box>
  );
};

const RelatedText = (props: {
  label: string;
  words: string[];
  onRelatedTextClicked: (word: string) => void;
}) => (
  <>
    <Typography variant={'subtitle2'}>{props.label}</Typography>
    <Box display={'flex'} flexWrap={'wrap'} flexDirection={'row'} gap={'4px'}>
      {props.words.map((word) => (
        <WordChip
          key={word}
          word={word}
          onClick={() => props.onRelatedTextClicked(word)}
        />
      ))}
    </Box>
  </>
);
