import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { fetchRhymes } from 'common/fetchRhymes';
import { Rhyme } from 'common/Rhyme';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { FunctionComponent, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Observable } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { WordAtPosition } from './Editor';

interface RhymesProp {
  className?: string;
  onRhymeClicked: (rhyme: Rhyme, position: monaco.IRange) => void;
  queries: Observable<WordAtPosition>;
}

const useStyles = makeStyles((theme: Theme) => ({
  rhyme: {
    wordBreak: 'break-all'
  }
}));

export const Rhymes: FunctionComponent<RhymesProp> = (props: RhymesProp) => {
  const classes = useStyles(undefined);
  const [rhymes, setRhymes] = useState([] as Rhyme[]);
  const [queryData, setQueryData] = useState(null as WordAtPosition);
  const [loading, setLoading] = useState(false);

  useEffect(handleQueries(props.queries, setRhymes, setQueryData, setLoading), [
    props.queries
  ]);

  function renderRhyme(rowProps: ListChildComponentProps): React.ReactElement {
    const { index, style } = rowProps;
    const rhyme = rhymes[index];

    return (
      <ListItem
        button
        className={classes.rhyme}
        style={style}
        color={'primary'}
        key={rhyme.word}
      >
        <ListItemText
          primary={rhyme.word}
          onClick={() => {
            setLoading(true);
            props.onRhymeClicked(rhyme, queryData.range);
          }}
        />
      </ListItem>
    );
  }

  if (loading) {
    return (
      <Box
        className={props.className}
        display="flex"
        width={'100%'}
        height={'100%'}
      >
        <CircularProgress style={{ margin: 'auto' }} />
      </Box>
    );
  }
  return (
    <div className={props.className}>
      <AutoSizer defaultHeight={100}>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            itemCount={rhymes.length}
            itemSize={72}
            width={width}
          >
            {renderRhyme}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

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
