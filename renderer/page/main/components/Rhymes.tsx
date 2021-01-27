import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, styled, Theme } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { VirtuosoGrid } from 'react-virtuoso';
import { logger } from '../globals';
import { Rhyme } from '../models/rhyme';
import { fetchRhymes } from '../networking/fetchRhymes';
import { WordAtPosition } from '../../../codemirror/main/wordSelection';
import { useSelectedWords } from '../stores/SelectedWordStore';

interface RhymesProp {
  onRhymeClicked: (rhyme: Rhyme, from: number, to: number) => void;
}

const useStyles = makeStyles((theme: Theme) => ({
  rhymeList: {
    color: theme.palette.text.disabled,
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  rhyme: {
    'text-align': 'center',
    '&:hover': {
      background: theme.palette.background.paper,
    },
  },
}));

const ListContainer: React.ComponentType<{ className: string }> = styled('div')(
  ({ className }) => ({
    className,
    display: 'flex',
    'flex-wrap': 'wrap',
  })
);

const ItemContainer: React.ComponentType<{ className: string }> = styled('div')(
  ({ theme }) => ({
    display: 'flex',
    flex: 'none',
    'align-content': 'stretch',
    [theme.breakpoints.up('xs')]: {
      width: '50%',
    },
    [theme.breakpoints.up('md')]: {
      width: '100%',
      height: '80px',
    },
    [theme.breakpoints.up('lg')]: {
      width: '50%',
    },
  })
);

export function Rhymes(props: RhymesProp) {
  const [rhymes, setRhymes] = useState<Rhyme[]>([]);
  const [queryData, setQueryData] = useState<WordAtPosition>(null);
  const classes = useStyles();

  const handleError = useErrorHandler();
  useSelectedWords(setQueryData);
  useEffect(handleQueries(queryData, setRhymes, handleError), [
    queryData,
    setRhymes,
    handleError,
  ]);

  if (rhymes.length === 0) {
    return <div />;
  }
  return (
    <VirtuosoGrid
      ListContainer={ListContainer}
      ItemContainer={ItemContainer}
      style={{ width: '100%', height: '100%' }}
      overscan={100}
      totalCount={rhymes.length}
      listClassName={classes.rhymeList}
      item={(index) => {
        const rhyme = rhymes[index];

        return renderRhyme(rhyme, classes.rhyme, () => {
          props.onRhymeClicked(rhyme, queryData.from, queryData.to);
        });
      }}
    />
  );
}

function renderRhyme(
  rhyme: Rhyme,
  className: string,
  onClick: () => void
): React.ReactElement {
  return (
    <Box flex={1} width={'100%'} height={'100%'}>
      <ListItem
        className={className}
        button
        key={rhyme.word ?? ''}
        style={{ height: '100%' }}
      >
        <ListItemText
          onClick={onClick}
          primary={rhyme.word ?? ''}
          primaryTypographyProps={{ align: 'center' }}
        />
      </ListItem>
    </Box>
  );
}

function handleQueries(
  query: WordAtPosition,
  setRhymes: (rhymes: Rhyme[]) => void,
  handleError: (error: Error) => void
) {
  return () => {
    if (!query) {
      return;
    }
    logger.debug(`Querying rhymes for word: ${query.word}`);
    fetchRhymes(query.word)
      .then((rhymes) =>
        rhymes.filter((rhyme) => rhyme && rhyme.word && rhyme.score)
      )
      .then(setRhymes)
      .catch((reason) => {
        if (reason instanceof Error) {
          handleError(reason);
        } else {
          handleError(new Error(reason));
        }
      });
  };
}
