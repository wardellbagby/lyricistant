import { from, Observable, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rhyme } from '../models/rhyme';

const url = 'https://lyricistant.wardellbagby.workers.dev';
type RhymeType = 'perfect' | 'near' | 'sounds-like';

const asyncRhymes = async (word: string, type: RhymeType): Promise<Rhyme[]> => {
  let param;
  switch (type) {
    case 'perfect':
      param = 'rel_rhy';
      break;
    case 'near':
      param = 'rel_nry';
      break;
    case 'sounds-like':
      param = 'sl';
      break;
  }
  const response = await fetch(`${url}/words?${param}=${word}`);
  return await response.json();
};

export function fetchRhymes(word: string): Observable<Rhyme[]> {
  if (word.length === 0) {
    return of();
  }

  return zip(
    from(asyncRhymes(word, 'perfect')).pipe(
      map((rhymes: Rhyme[]) =>
        rhymes.map((rhyme: Rhyme) => new Rhyme(rhyme.word, rhyme.score + 10000))
      )
    ),
    from(asyncRhymes(word, 'near')).pipe(
      map((rhymes: Rhyme[]) =>
        rhymes.map((rhyme: Rhyme) => new Rhyme(rhyme.word, rhyme.score + 1000))
      )
    ),
    asyncRhymes(word, 'sounds-like')
  ).pipe(
    map((results: Rhyme[][]) =>
      [...new Set(results.flat())].sort(
        (left: Rhyme, right: Rhyme) => right.score - left.score
      )
    )
  );
}
