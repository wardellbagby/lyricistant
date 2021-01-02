import { Logger } from '@common/Logger';
import { from, Observable, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { appComponent } from '../globals';
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

  const logger = appComponent.get<Logger>();
  logger.debug(`Fetching ${type} rhymes for word: ${word}`);
  const response = await fetch(`${url}/words?${param}=${word}&max=25`);

  if (response.ok && response.status < 400) {
    const text = await response.text();
    logger.debug(`Response for ${type} and ${word}`, text);
    try {
      return JSON.parse(text);
    } catch (e) {
      logger.error("Couldn't parse rhymes response to JSON!", word, text);
      return [];
    }
  }
  logger.error(
    'Failed to fetch rhymes! Returning an empty list.',
    word,
    response
  );
  return [];
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
    from(asyncRhymes(word, 'sounds-like'))
  ).pipe(
    map((results: Rhyme[][]) =>
      [...new Set(flatten(results))].sort(
        (left: Rhyme, right: Rhyme) => right.score - left.score
      )
    )
  );
}

const flatten: <T>(input: T[][]) => T[] = (array) => {
  return array.reduce((prev, current) => {
    return prev.concat(current);
  });
};
