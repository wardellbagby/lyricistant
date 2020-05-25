import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Observable } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { Rhyme } from '../models/rhyme';
import { fetchRhymes } from '../networking/fetchRhymes';
import { WordAtPosition } from './Editor';

interface RhymesProp {
  onRhymeClicked: (rhyme: Rhyme, position: monaco.IRange) => void;
  queries: Observable<WordAtPosition>;
}

const useStyles = makeStyles((theme: Theme) => ({
  rhymeList: {
    wordBreak: 'break-all',
    color: theme.palette.text.disabled,
    '&:hover': {
      color: theme.palette.text.primary
    }
  }
}));

const ListContainer: React.FC<{
  listRef: (ref: HTMLElement | null) => void;
  style: CSSProperties;
}> = ({ listRef, style, children }) => {
  const classes = useStyles(undefined);
  return (
    <List ref={listRef} style={style} className={classes.rhymeList}>
      {children}
    </List>
  );
};

export const Rhymes: FunctionComponent<RhymesProp> = (props: RhymesProp) => {
  const [rhymes, setRhymes] = useState<Rhyme[]>([]);
  const [queryData, setQueryData] = useState<WordAtPosition>(null);
  const [loading, setLoading] = useState(false);

  useEffect(handleQueries(props.queries, setRhymes, setQueryData, setLoading), [
    props.queries
  ]);

  if (loading) {
    return (
      <Box display="flex" width={'100%'} height={'100%'}>
        <CircularProgress style={{ margin: 'auto' }} />
      </Box>
    );
  }
  return (
    <Virtuoso
      ListContainer={ListContainer}
      style={{ width: '100%', height: '100%' }}
      totalCount={rhymes.length}
      item={(index) => {
        const rhyme = rhymes[index];

        return renderRhyme(rhyme, () => {
          setLoading(true);
          props.onRhymeClicked(rhyme, queryData.range);
        });
      }}
    />
  );
};

function renderRhyme(rhyme: Rhyme, onClick: () => void): React.ReactElement {
  return (
    <ListItem button key={rhyme.word}>
      <ListItemText onClick={onClick} primary={rhyme.word} />
    </ListItem>
  );
}

function handleQueries(
  queries: Observable<WordAtPosition>,
  setRhymes: (rhymes: Rhyme[]) => void,
  setQueryData: (queryData: WordAtPosition) => void,
  setLoading: (loading: boolean) => void
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
                  )
                ]
              };
            })
          )
        )
      )
      .subscribe(
        (result: { queryData: WordAtPosition; rhymes: Rhyme[] }): void => {
          setLoading(false);
          setRhymes(result.rhymes);
          setQueryData(result.queryData);
        }
      );

    return () => subscription.unsubscribe();
  };
}
