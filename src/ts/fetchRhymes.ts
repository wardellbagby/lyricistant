import { words } from 'datamuse';
import { from as rxFrom, Observable, of } from 'rxjs';
import { Rhyme } from './Rhyme';

export function fetchRhymes(word: string): Observable<Rhyme[]> {
    if (word.length === 0) {
        return of();
    }

    return rxFrom(
        Promise.all<Rhyme[]>([words({ rel_rhy: word }), words({ rel_nry: word })])
            .then((results: Rhyme[][]) => results.flat())
    );

}
