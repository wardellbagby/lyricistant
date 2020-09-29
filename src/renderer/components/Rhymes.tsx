import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, styled, Theme } from '@material-ui/core/styles';
import * as CodeMirror from 'codemirror';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Observable } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { Rhyme } from '../models/rhyme';
import { fetchRhymes } from '../networking/fetchRhymes';
import { WordAtPosition } from './Editor';

interface RhymesProp {
  onRhymeClicked: (rhyme: Rhyme, position: CodeMirror.Range) => void;
  queries: Observable<WordAtPosition>;
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
  ({ className }) => {
    return {
      className,
      display: 'flex',
      'flex-wrap': 'wrap',
    };
  }
);

const ItemContainer: React.ComponentType<{ className: string }> = styled('div')(
  ({ theme }) => {
    return {
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
    };
  }
);

export const Rhymes: FunctionComponent<RhymesProp> = (props: RhymesProp) => {
  const [rhymes, setRhymes] = useState<Rhyme[]>([]);
  const [queryData, setQueryData] = useState<WordAtPosition>(null);
  const classes = useStyles();

  useEffect(handleQueries(props.queries, setRhymes, setQueryData), [
    props.queries,
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
          props.onRhymeClicked(rhyme, queryData.range);
        });
      }}
    />
  );
};

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
        key={rhyme.word}
        style={{ height: '100%' }}
      >
        <ListItemText
          onClick={onClick}
          primary={rhyme.word}
          primaryTypographyProps={{ align: 'center' }}
        />
      </ListItem>
    </Box>
  );
}

function handleQueries(
  queries: Observable<WordAtPosition>,
  setRhymes: (rhymes: Rhyme[]) => void,
  setQueryData: (queryData: WordAtPosition) => void
): () => () => void {
  return () => {
    const subscription = queries
      .pipe(
        debounceTime(400),
        switchMap((data: WordAtPosition) =>
          fetchRhymes(data.word).pipe(
            map((rhymes: Rhyme[]) => {
              return {
                queryData: data,
                rhymes: [
                  ...new Set(
                    rhymes.filter(
                      (value, index, array) => array.indexOf(value) === index
                    )
                  ),
                ],
              };
            })
          )
        )
      )
      .subscribe(
        (result: { queryData: WordAtPosition; rhymes: Rhyme[] }): void => {
          setRhymes(result.rhymes);
          setQueryData(result.queryData);
        }
      );

    return () => subscription.unsubscribe();
  };
}
