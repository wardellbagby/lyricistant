import { Rhyme } from '@lyricistant/renderer/models/rhyme';
import { expose } from 'comlink';
import pronunciationsJson from './pronunciations.json';

interface Pronunciation {
  pr: string;
  p?: number;
}

// Force retype so that the IDE doesn't freak out with the large JSON file.
const pronunciations = pronunciationsJson as Record<string, Pronunciation>;
const cache = new Map<string, Rhyme[]>();
const MAX_POPULARITY_SCORE = 100_000;
const MAX_RHYMES_COUNT = 100;
const MAX_CACHE_COUNT = 100;

export const generateRhymes = (word: string): Rhyme[] => {
  if (!word) {
    return [];
  }

  word = word.toLowerCase();

  if (cache.has(word)) {
    return cache.get(word);
  }
  const wordPronunciation = pronunciations[word];

  if (!wordPronunciation) {
    return [];
  }

  const generatedRhymes: Rhyme[] = [];

  for (const dictWord of Object.keys(pronunciations)) {
    const baseWord = getBaseWord(dictWord);
    if (baseWord !== word) {
      const result = compare(
        pronunciations[dictWord],
        baseWord,
        wordPronunciation
      );
      if (result) {
        generatedRhymes.push(result);
      }
    }
  }

  const results = generatedRhymes
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RHYMES_COUNT);

  cache.set(word, results);
  if (cache.size > MAX_CACHE_COUNT) {
    cache.delete(cache.keys().next().value);
  }

  return results;
};

const reverseSyllables = (pronunciation: string) =>
  pronunciation.replace(/[0-9]/g, '').split(' ').reverse();

const calculateScore = (left: string, right: string) => {
  const leftSyllables = reverseSyllables(left);
  const rightSyllables = reverseSyllables(right);
  const length = Math.max(left.length, right.length);
  let score = 0;

  for (let index = 0; index < length; index++) {
    if (leftSyllables[index] !== rightSyllables[index]) {
      break;
    }

    score += MAX_POPULARITY_SCORE;
  }

  if (leftSyllables.length === rightSyllables.length) {
    score += MAX_POPULARITY_SCORE;
  }

  return score;
};

const getBaseWord = (word: string) => {
  const index = word.indexOf('(');
  return index < 0 ? word : word.slice(0, index).trim();
};

const compare = (
  dictPronunciation: Pronunciation,
  dictWord: string,
  pronunciation: Pronunciation
) => {
  let score = calculateScore(dictPronunciation.pr, pronunciation.pr);

  if (score > 1) {
    if (dictPronunciation.p) {
      score += (MAX_POPULARITY_SCORE - dictPronunciation.p) * 2;
    }
    return {
      score,
      word: dictWord,
    };
  }
};

expose({
  generateRhymes,
});
