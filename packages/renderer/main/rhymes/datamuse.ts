import { logger } from "@lyricistant/renderer/globals";
import { Rhyme } from './rhyme';

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

export const fetchRhymes = async (word: string): Promise<Rhyme[]> => {
  if (word.length === 0) {
    return [];
  }

  return Promise.all([
    asyncRhymes(word, 'perfect').then((rhymes) => increaseScore(rhymes, 10000)),
    asyncRhymes(word, 'near').then((rhymes) => increaseScore(rhymes, 1000)),
    asyncRhymes(word, 'sounds-like'),
  ]).then((results) =>
    [...new Set(flatten(results))].sort(
      (left: Rhyme, right: Rhyme) => right.score - left.score
    )
  );
};

const increaseScore = (rhymes: Rhyme[], amount: number) =>
  rhymes.map((rhyme: Rhyme) => new Rhyme(rhyme.word, rhyme.score + amount));

const flatten: <T>(input: T[][]) => T[] = (array) =>
  array.reduce((prev, current) => prev.concat(current));
