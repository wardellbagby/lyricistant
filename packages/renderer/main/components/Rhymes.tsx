import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, styled, Theme } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { GridItem, VirtuosoGrid } from 'react-virtuoso';
import { logger } from '../globals';
import { Rhyme } from '../models/rhyme';
import { fetchRhymes } from '../networking/fetchRhymes';
import {
  useSelectedWordPosition,
  useSelectedWords,
  useSelectedWordStore,
} from '../stores/SelectedWordStore';

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

const ItemContainer: React.ComponentType<GridItem> = styled('div')(
  ({ theme }) => ({
    display: 'flex',
    flex: 'none',
    'align-content': 'stretch',
    [theme.breakpoints.up('xs')]: {
      width: '50%',
      height: '50px',
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

export function Rhymes() {
  const [rhymes, setRhymes] = useState<Rhyme[]>([]);
  const classes = useStyles();

  const selectedWordStore = useSelectedWordStore();
  const handleError = useErrorHandler();
  const selectedWord = useSelectedWords();
  const selectedWordPosition = useSelectedWordPosition();

  useEffect(() => {
    if (!selectedWord) {
      setRhymes([]);
      return;
    }

    let isCancelled = false;
    new Promise((resolve) => {
      // Debounce.
      setTimeout(() => {
        if (!isCancelled) {
          logger.debug(`Querying rhymes for word: ${selectedWord}`);
          resolve(selectedWord);
        }
      }, 400);
    })
      .then(fetchRhymes)
      .then((results) =>
        results.filter((rhyme) => rhyme && rhyme.word && rhyme.score)
      )
      .then(setRhymes)
      .catch((reason) => {
        if (reason instanceof Error) {
          handleError(reason);
        } else {
          handleError(new Error(reason));
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedWord, setRhymes, handleError]);

  if (rhymes.length === 0) {
    return <div />;
  }
  return (
    <VirtuosoGrid
      components={{ Item: ItemContainer, List: ListContainer }}
      style={{ width: '100%', height: '100%' }}
      overscan={100}
      totalCount={rhymes.length}
      listClassName={classes.rhymeList}
      itemContent={(index) => {
        const rhyme = rhymes[index];

        if (!rhyme) {
          return;
        }

        return renderRhyme(rhyme, classes.rhyme, () => {
          setRhymes([]);
          selectedWordStore.onWordReplaced({
            originalWord: {
              word: selectedWord,
              from: selectedWordPosition[0],
              to: selectedWordPosition[1],
            },
            newWord: rhyme.word,
          });
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
    <Box flex={1} width={'100%'} height={'100%'} onClick={onClick}>
      <ListItem
        className={className}
        button
        key={rhyme.word ?? ''}
        style={{ height: '100%' }}
      >
        <ListItemText
          primary={rhyme.word ?? ''}
          primaryTypographyProps={{ align: 'center' }}
        />
      </ListItem>
    </Box>
  );
}
