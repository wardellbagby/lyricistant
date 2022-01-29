#!/usr/bin/env -S node -r ./register-ts-node

import fs, { writeFileSync } from 'fs';
import path from 'path';
import axios from 'axios';
import popularWordsJson from './popular.json';

/**
 * List of popular words where the index of the word in this list directly relates to its popularity.
 *
 * This list is sorted in descending order, so the item at index 0 is the most popular word.
 */
const popularWords: string[] = popularWordsJson as string[];

/**
 * The format the pronunciations will be saved as. Should be kept as condensed as possible for reduce file size.
 */
interface Output {
  /**
   * A mapping of word to pronunciation and optional popularity.
   */
  [word: string]: {
    /**
     * The pronunciation for the word.
     */
    pr: string;
    /**
     * The popularity of the word, which is just an index in the popular words list, if available. Otherwise, omitted.
     */
    p?: number;
  };
}

/**
 * A list of two elements lists of words and pronunciations. I.e.,
 *
 * [ ["hello, "HH AH0 L OW1"], ["words", "W ER1 D Z"] ]
 */
type Pronunciations = Array<[string, string]>;

/**
 * Carnegie Mellon University maintains a list of pronunciations on GitHub;
 * pull those and format them for use in Lyricistant.
 *
 * Expected format for cmudict.dict:
 *
 * ```
 * abduct AE0 B D AH1 K T
 * abducted AE0 B D AH1 K T IH0 D
 * abducted(2) AH0 B D AH1 K T IH0 D
 * ```
 *
 */
const loadCmuPronunciations = async (): Promise<Pronunciations> => {
  const cmuDictUrl =
    'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
  const response = await axios.get(cmuDictUrl);
  const data: string = response.data;

  return data
    .split('\n') // Split into lines.
    .map((line) => [
      // The word
      line.slice(0, line.indexOf(' ')).trim().toLowerCase(),
      // The pronunciation
      line.slice(line.indexOf(' ') + 1),
    ]);
};

/**
 * For words that CMUDict doesn't provide, there's an `additional_pronunciations.dict` file provided with Lyricistant
 * in a very similar format to the CMUDict file. Pull those and format them for use in Lyricistant.
 *
 * Expected format of `additional_pronunciations.dict`:
 *
 * ```
 * SWAG  S W AE G
 * BRUH  B R UW
 * FAM  F AE M
 * ```
 *
 * Note: This file sometimes separates words with spaces or tabs, while CMUDict only uses spaces. This is due
 * to the lextool CMU provides that populates the file liking to output results with tabs and those being copy-pasted
 * directly into the file. This logic supports both tabs and spaces due to that.
 */
const loadAdditionalPronunciations = async (): Promise<Pronunciations> => {
  const data = await fs.promises.readFile(
    path.resolve(__dirname, 'additional_pronounciations.dict'),
    'utf8'
  );

  return data
    .split('\n')
    .filter((line) => !line.startsWith('#')) // Ignores any comment lines.
    .map((line) => line.replace('\t', ' '))
    .map((line) => [
      // The word
      line.slice(0, line.indexOf(' ')).trim().toLowerCase(),
      // The pronunciation
      line.slice(line.indexOf(' ') + 1),
    ]);
};

/**
 * Using both the pronunciations and a mapping of words to their popularity,
 * create an object that can be used by Lyricistant to generate rhymes.
 *
 * @param pronunciations a list of [word, pronunciation] lists.
 * @param indexedPopularWords
 */
const writePronunciations = async (
  pronunciations: Pronunciations,
  indexedPopularWords: Record<string, number>
) => {
  const output: Output = Object.create(null);

  for (const [word, pronunciation] of pronunciations) {
    let popularity = indexedPopularWords[getBaseWord(word)];
    if (popularity < 0) {
      popularity = undefined;
    }
    output[word] = {
      pr: pronunciation,
      p: popularity,
    };
  }
  writeFileSync(
    'packages/rhyme-generator/main/pronunciations.json',
    JSON.stringify(output)
  );
};

/**
 * Reads `popular.json` and returns a mapping of a word to its popularity in
 * the format of:
 *
 * ```
 * {
 *   word: 809,
 *   up: 53
 * }
 * ```
 */
const createIndexedPopularWords = async () => {
  const result: Record<string, number> = Object.create(null);

  popularWords.forEach((word, index) => {
    result[word] = index;
  });

  return result;
};

/**
 * CMU's pronunciations includes multiple pronunciations for certain words.
 * E.g., read, which has multiple pronunciations in U.S. English.
 *
 * Extra pronunciations look like `read(2)`.
 *
 * This function takes a word that might represent an extra pronunciation and
 * gets the word without the suffix.
 *
 * I.e., pass this `read(2)` and get back `read`
 *
 * @param word a word read from CMUDict or `additional_pronunciations.dict`
 */
const getBaseWord = (word: string) => {
  const index = word.indexOf('(');
  return index < 0 ? word : word.slice(0, index).trim();
};

const start = async () => {
  console.log('Starting...');

  const pronunciations = await loadCmuPronunciations();
  console.log('Loaded CMU pronunciations');

  pronunciations.push(...(await loadAdditionalPronunciations()));
  console.log('Loaded extra pronunciations');

  pronunciations.sort((left, right) => left[0].localeCompare(right[0]));

  const indexedPopularWords = await createIndexedPopularWords();
  console.log('Created popular words');

  await writePronunciations(pronunciations, indexedPopularWords);
  console.log('Finished!');
};

start().catch((reason) => {
  console.error('Failed to load pronunciations', reason);
  process.exit(1);
});
