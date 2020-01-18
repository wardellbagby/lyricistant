import Fade from '@material-ui/core/Fade';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { fetchRhymes } from 'common/fetchRhymes';
import { Rhyme } from 'common/Rhyme';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { FunctionComponent, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Observable } from 'rxjs';
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { WordAtPosition } from './Editor';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

interface RhymesProp {
    onRhymeClicked: (rhyme: Rhyme, position: monaco.IRange) => void;
    queries: Observable<WordAtPosition>;
}

export const Rhymes: FunctionComponent<RhymesProp> = (props: RhymesProp) => {
    const [rhymes, setRhymes] = useState([] as Rhyme[]);
    const [queryData, setQueryData] = useState(null as WordAtPosition);
    const [loading, setLoading] = useState(false);

    useEffect(
        handleQueries(
            props.queries,
            setRhymes,
            setQueryData,
            setLoading),
        [props.queries]);

    function renderRhymeWithState(rowProps: ListChildComponentProps): React.ReactElement {
        const { index, style } = rowProps;
        const rhyme = rhymes[index];

        return (
            <Fade in={true}>
                <ListItem button style={style} color={'primary'} key={rhyme.word}>
                    <ListItemText
                        primary={rhyme.word}
                        onClick={() => {
                            setLoading(true)
                            props.onRhymeClicked(rhyme, queryData.range)
                        }} />
                </ListItem>
            </Fade>
        );
    }

    if (loading) {
        return (
            <Box display='flex' width={'100%'} height={'100%'}>
                <CircularProgress style={{ margin: 'auto' }} />
            </Box>
        )
    }
    return (
        <AutoSizer>
            {({ height, width }) => (
                <FixedSizeList height={height} itemCount={rhymes.length} itemSize={72} width={width} >
                    {renderRhymeWithState}
                </FixedSizeList>
            )}
        </AutoSizer>
    );
};

function handleQueries(
    queries: Observable<WordAtPosition>,
    setRhymes: (rhymes: Rhyme[]) => void,
    setQueryData: (queryData: WordAtPosition) => void,
    setLoading: (loading: boolean) => void
): () => () => void {
    return () => {
        const subscription = queries.pipe(
            debounceTime(400),
            switchMap((data: WordAtPosition) =>
                fetchRhymes(data.word)
                    .pipe(
                        map((rhymes: Rhyme[]) => {
                            return {
                                queryData: data,
                                rhymes: [...new Set(rhymes
                                    .filter((value, index, array) => array.indexOf(value) === index))]
                            };
                        })
                    )
            )
        )
            .subscribe((result: { queryData: WordAtPosition; rhymes: Rhyme[] }): void => {
                setLoading(false)
                setRhymes(result.rhymes);
                setQueryData(result.queryData);
            });

        return () => subscription.unsubscribe();;
    };
}
