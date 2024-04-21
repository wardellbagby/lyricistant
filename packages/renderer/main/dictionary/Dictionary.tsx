import { DetailPaneChildProps } from '@lyricistant/renderer/detail/DetailPane';
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
    onLoadingChanged?.(state.matches('loading'));
  }, [state.matches('loading')]);

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

      <NullStateText
        visible={state.matches('no-results')}
        text={'No definition found'}
      />

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
      <Typography variant={'h5'}>{props.query}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {props.meanings.map((meaning, index) => (
          <React.Fragment key={JSON.stringify(meaning)}>
            <VisualMeaning
              meaning={meaning}
              onRelatedTextClicked={props.onRelatedTextClicked}
            />
            {(meaning.synonyms?.length > 0 || meaning.antonyms?.length > 0) && (
              <Divider variant={'middle'}>
                <Typography variant={'caption'}>Related</Typography>
              </Divider>
            )}
            <RelatedTextLists
              disablePadding
              synonyms={meaning.synonyms}
              antonyms={meaning.antonyms}
              onRelatedTextClicked={props.onRelatedTextClicked}
            />
            {index < props.meanings.length - 1 && (
              <Divider variant={'fullWidth'} />
            )}
          </React.Fragment>
        ))}
      </Box>
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
        showHeader={props.meaning.definitions.length > 1}
        key={index}
        index={index + 1}
        definition={definition}
        onRelatedTextClicked={props.onRelatedTextClicked}
      />
    ))}
  </Box>
);

const VisualDefinition = ({
  index,
  definition,
  showHeader,
  onRelatedTextClicked,
}: {
  index: number;
  showHeader: boolean;
  definition: Definition;
  onRelatedTextClicked: (word: string) => void;
}) => (
  <Box>
    {showHeader && (
      <Divider
        variant={'middle'}
        sx={{
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        <Typography variant={'caption'}>{index}</Typography>
      </Divider>
    )}
    <Typography>{definition.definition}</Typography>
    {definition.example?.trim()?.length > 0 && (
      <Typography variant={'body2'} sx={{ fontStyle: 'italic' }}>
        {definition.example}
      </Typography>
    )}
    <RelatedTextLists
      synonyms={definition.synonyms}
      antonyms={definition.antonyms}
      onRelatedTextClicked={onRelatedTextClicked}
    />
  </Box>
);

const RelatedTextLists = (props: {
  disablePadding?: boolean;
  synonyms: string[];
  antonyms: string[];
  onRelatedTextClicked: (word: string) => void;
}) => {
  const shouldHide = useMemo(
    () => !(props.antonyms?.length > 0 || props.synonyms?.length > 0),
    [props.synonyms, props.antonyms]
  );
  const synonyms = useMemo(
    () => [...new Set(props.synonyms)],
    [props.synonyms]
  );
  const antonyms = useMemo(
    () => [...new Set(props.antonyms)],
    [props.antonyms]
  );
  const hasSynonyms = synonyms.length > 0;
  const hasAntonyms = antonyms.length > 0;
  return (
    <Box
      sx={{
        padding: props.disablePadding ? undefined : '4px',
        display: shouldHide ? 'none' : undefined,
      }}
    >
      {hasSynonyms && (
        <RelatedText
          label={hasAntonyms ? 'Synonyms' : null}
          words={synonyms}
          onRelatedTextClicked={props.onRelatedTextClicked}
        />
      )}
      {hasSynonyms && hasAntonyms && <Box height={'8px'} />}
      {hasAntonyms && (
        <RelatedText
          label={'Antonyms'}
          words={antonyms}
          onRelatedTextClicked={props.onRelatedTextClicked}
        />
      )}
    </Box>
  );
};

const RelatedText = (props: {
  label?: string;
  words: string[];
  onRelatedTextClicked: (word: string) => void;
}) => (
  <>
    {props.label && (
      <Typography
        variant={'subtitle2'}
        sx={{ paddingBottom: '4px', fontSize: 'italic' }}
      >
        {props.label}
      </Typography>
    )}
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
