import { words } from 'datamuse';
import { Observable, of, zip } from 'rxjs';
import { Rhyme } from './Rhyme';
import { map } from 'rxjs/operators';

export function fetchRhymes(word: string): Observable<Rhyme[]> {
    if (word.length === 0) {
        return of();
    }

    return zip(
        words({ rel_rhy: word }),
        words({ rel_nry: word }),
        words({ sl: word })
    )
        .pipe(
            map((results: Rhyme[][]) =>
                [...new Set(results.flat())]
                    .sort((left: Rhyme, right: Rhyme) => right.score - left.score))
        )

}
