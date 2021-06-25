import { Rhyme } from '@lyricistant/renderer/models/rhyme';
import pronunciationsJson from './pronunciations.json';

interface Pronunciation {
  pr: string;
  p?: number;
}

// Force retype so that the IDE doesn't freak out with the large JSON file.
const pronunciations: Record<string, Pronunciation> = pronunciationsJson;
const knownWords: string[] = Object.keys(pronunciations);
const MAX_POPULARITY_SCORE = 100_000;

export const generateRhymes = (word: string): Rhyme[] => {
  if (!word) {
    return [];
  }

  word = word.toLowerCase();

  if (cache.has(word)) {
    return cache.get(word);
  }
  if (!knownWords.includes(word)) {
    return [];
  }

  const wordPronunciation = pronunciations[word];
  const results: Rhyme[] = [];

  Object.keys(pronunciations).forEach((dictWord: string) => {
    const baseWord = getBaseWord(dictWord);
    if (baseWord !== word) {
      const result = compare(
        pronunciations[dictWord],
        baseWord,
        wordPronunciation
      );
      if (result) {
        results.push(result);
      }
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 100);
};

const cache: Map<string, Rhyme[]> = new Map();

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
