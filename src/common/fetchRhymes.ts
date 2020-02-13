import { words } from 'datamuse';
import { from, Observable, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rhyme } from './Rhyme';

export function fetchRhymes(word: string): Observable<Rhyme[]> {
  if (word.length === 0) {
    return of();
  }

  return zip(
    from(words({ rel_rhy: word })).pipe(
      map((rhymes: Rhyme[]) =>
        rhymes.map((rhyme: Rhyme) => new Rhyme(rhyme.word, rhyme.score + 10000))
      )
    ),
    from(words({ rel_nry: word })).pipe(
      map((rhymes: Rhyme[]) =>
        rhymes.map((rhyme: Rhyme) => new Rhyme(rhyme.word, rhyme.score + 1000))
      )
    ),
    words({ sl: word })
  ).pipe(
    map((results: Rhyme[][]) =>
      [...new Set(results.flat())].sort(
        (left: Rhyme, right: Rhyme) => right.score - left.score
      )
    )
  );
}
