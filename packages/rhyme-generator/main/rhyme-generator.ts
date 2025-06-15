import pronunciationsJson from './pronunciations.json';

/** The data structure used in the Pronunciations JSON that will be keyed by a word. */
type Pronunciation = [pronunciation: string, popularity?: number];

interface Rhyme {
  score: number;
  word: string;
}

// Force retype so that the IDE doesn't freak out with the large JSON file.
const pronunciations = pronunciationsJson as unknown as Record<
  string,
  Pronunciation
>;

const cache = new Map<string, Rhyme[]>();
const MAX_POPULARITY_SCORE = 100_000;
const MAX_RHYMES_COUNT = 100;
const MAX_CACHE_COUNT = 100;

export const generateRhymes = (input: string): Rhyme[] => {
  if (!input) {
    return [];
  }

  input = input.toLowerCase();

  if (cache.has(input)) {
    return cache.get(input);
  }
  const wordPronunciation = pronunciations[input];

  if (!wordPronunciation) {
    return [];
  }

  const generatedRhymes: Rhyme[] = [];

  for (const dictWord of Object.keys(pronunciations)) {
    const match = getBaseWord(dictWord);
    if (match !== input) {
      const result = compare(
        wordPronunciation,
        pronunciations[dictWord],
        match,
      );
      if (result) {
        generatedRhymes.push(result);
      }
    }
  }

  const results = generatedRhymes
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RHYMES_COUNT)
    .filter(
      (left, index) =>
        index ===
        generatedRhymes.findIndex((right) => left.word === right.word),
    );

  cache.set(input, results);
  if (cache.size > MAX_CACHE_COUNT) {
    cache.delete(cache.keys().next().value);
  }

  return results;
};

const reverseSyllables = (pronunciation: string) =>
  pronunciation.split(' ').reverse();

const removeStress = (syllable: string) => syllable.replace(/[0-9]/g, '');

const calculateScore = (input: string, match: string) => {
  const inputSyllables = reverseSyllables(input);
  const inputStressedIndex = inputSyllables.findIndex((value) =>
    value.includes('1'),
  );
  const matchSyllables = reverseSyllables(match);
  const length = Math.min(inputSyllables.length, matchSyllables.length);
  let score = 0;

  for (let index = 0; index < length; index++) {
    const inputSyllable = inputSyllables[index];
    const matchSyllable = matchSyllables[index];

    if (removeStress(inputSyllable) !== removeStress(matchSyllable)) {
      if (index <= inputStressedIndex) {
        // If we don't match up to the first stressed syllable, the rhyme is probably bad.
        return 0;
      }
      break;
    }

    score += 1;
    if (inputSyllable.includes('1') && matchSyllable.includes('1')) {
      // If the same syllable is stressed in both, that's a good sign!
      score += 1;
    }
  }

  if (inputSyllables.length === matchSyllables.length) {
    score += 1;
  }

  return score * MAX_POPULARITY_SCORE;
};

const compare = (
  inputPronunciation: Pronunciation,
  matchPronunciation: Pronunciation,
  matchWord: string,
) => {
  let score = calculateScore(inputPronunciation[0], matchPronunciation[0]);

  if (score > 1) {
    if (matchPronunciation[1]) {
      /*
       Popular words should match better than their unpopular peers, but not so
       well that they match higher than more "correct" matches.
      */
      score += (MAX_POPULARITY_SCORE - matchPronunciation[1]) / 10;
    } else {
      // Unpopular words tend to be pretty weird, so demote them heavy.
      score -= MAX_POPULARITY_SCORE * 2;
    }
    return {
      score,
      word: matchWord,
    };
  }
};

const getBaseWord = (word: string) => {
  const index = word.indexOf('(');
  return index < 0 ? word : word.slice(0, index).trim();
};
