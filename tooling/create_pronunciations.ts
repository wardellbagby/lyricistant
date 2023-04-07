#!/usr/bin/env -S node -r ./register-ts-node

import fs, { writeFileSync } from 'fs';
import path from 'path';
import axios from 'axios';
import { uniq, lowerCase } from 'lodash';
import popularWordsJson from './popular.json';

/**
 * List of popular words where the index of the word in this list directly
 * relates to its popularity.
 *
 * This list is sorted in descending order, so the item at index 0 is the most
 * popular word.
 */
const popularWords: string[] = popularWordsJson as string[];

/**
 * The format the pronunciations will be saved as. Should be kept as condensed
 * as possible to reduce the file size.
 */
interface Output {
  /**
   * A mapping of word to pronunciation and optional popularity.
   *
   * The first item is the pronunciation; the second is the popularity, which
   * may not exist.
   */
  [word: string]: [pronunciation: string, popularity?: number];
}

/**
 * A list of two elements lists of words and pronunciations. I.e.,
 *
 * [ ["hello, "HH AH0 L OW1"], ["words", "W ER1 D Z"] ]
 */
type Pronunciations = Array<[string, string]>;

/**
 * Carnegie Mellon University maintains a list of pronunciations on GitHub; pull
 * those and format them for use in Lyricistant.
 *
 * Expected format for cmudict.dict:
 *
 * ```text
 * abduct AE0 B D AH1 K T
 * abducted AE0 B D AH1 K T IH0 D
 * abducted(2) AH0 B D AH1 K T IH0 D
 * ```
 */
const loadCmuPronunciations = async (): Promise<Pronunciations> => {
  const cmuDictUrl =
    'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
  const response = await axios.get(cmuDictUrl);
  const data: string = response.data;

  return loadFromDictionaryFile(data);
};

/**
 * For words that CMUDict doesn't provide, there's an
 * `additional_pronunciations.dict` file provided with Lyricistant in a very
 * similar format to the CMUDict file. Pull those and format them for use in Lyricistant.
 *
 * Expected format of `additional_pronunciations.dict`:
 *
 * ```text
 * SWAG  S W AE G
 * BRUH  B R UW
 * FAM  F AE M
 * ```
 *
 * Note: This file sometimes separates words with spaces or tabs, while CMUDict
 * only uses spaces. This is due to the lextool CMU provides that populates the
 * file liking to output results with tabs and those being copy-pasted directly
 * into the file. This logic supports both tabs and spaces due to that.
 */
const loadAdditionalPronunciations = async (): Promise<Pronunciations> => {
  const data = await fs.promises.readFile(
    path.resolve(__dirname, 'additional_pronounciations.dict'),
    'utf8'
  );

  return loadFromDictionaryFile(data);
};

/**
 * Load pronunciations from a CMUDict-like string, where `data` is a new-line
 * seperated string where every line has a word and a pronunciation, and the
 * word and pronunciation are seperated by a space or a tab.
 *
 * Ignores comments, which are defined as lines beginning with # or any text
 * after # in any line.
 *
 * ```text
 * # This is a comment that will be stripped.
 * SWAG  S W AE G # This is also a comment that will be striped.
 * BRUH  B R UW
 * FAM  F AE M
 * ```
 *
 * @param data A CMUDict-like string.
 */
const loadFromDictionaryFile = async (data: string): Promise<Pronunciations> =>
  data
    .split('\n')
    .filter((line) => !line.startsWith('#')) // Ignores any comment lines.
    .map((line) => line.replace('\t', ' '))
    .map((line) => {
      // Remove any in-line comments
      const commentIndex = line.indexOf('#');
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex);
      }
      return line;
    })
    .map((line) => [
      // The word
      line.slice(0, line.indexOf(' ')).trim().toLowerCase(),
      // The pronunciation
      line.slice(line.indexOf(' ') + 1),
    ]);

/**
 * Words used by the "inspire?" feature in the CodeMirror editor. Writes those
 * words to a file that can be read by that feature. These words should be
 * popular words that we also have offline rhymes for, in order to make sure we
 * only have mostly normal words.
 *
 * @param pronunciations A list of [word, pronunciation] lists.
 */
const writeSupportedWords = async (pronunciations: Pronunciations) => {
  // Use a set for quick lookups.
  const wordsWithPronunciations = new Set(pronunciations.map(([word]) => word));

  // Get rid of any potential duplicates after we've filtered out words we don't have words for.
  const output = uniq(
    popularWords.filter((word) => wordsWithPronunciations.has(word))
  )
    // Filter out any word that is less than 3 letters after getting rid of common symbols.
    .filter((word) => word.trim().replace(/['."-]/, '').length > 3)
    // Take the 5000 most popular words after we've done the filtering.
    .filter((word, index) => index < 5000)
    .map(lowerCase)
    .sort((left, right) => left.localeCompare(right));

  writeFileSync(
    'packages/renderer/main/app/inspiration_words.json',
    JSON.stringify(output)
  );
};

/**
 * Using both the pronunciations and a mapping of words to their popularity,
 * create an object that can be used by Lyricistant to generate rhymes.
 *
 * @param pronunciations A list of [word, pronunciation] lists.
 * @param indexedPopularWords
 */
const writePronunciations = async (
  pronunciations: Pronunciations,
  indexedPopularWords: Record<string, number>
) => {
  const output: Output = Object.create(null);

  for (const [word, pronunciation] of pronunciations) {
    if (word.trim().length === 0) {
      continue;
    }
    const popularity = indexedPopularWords[getBaseWord(word)] ?? -1;

    if (popularity < 0) {
      output[word] = [pronunciation];
    } else {
      output[word] = [pronunciation, popularity];
    }
  }
  writeFileSync(
    'packages/rhyme-generator/main/pronunciations.json',
    JSON.stringify(output)
  );
};

/**
 * Reads `popular.json` and returns a mapping of a word to its popularity in the
 * format of:
 *
 * ```json
 * {
 *   "word": 809,
 *   "up": 53
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
 * @param word A word read from CMUDict or `additional_pronunciations.dict`
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

  console.log('Writing pronunciations for rhyme-generator');
  await writePronunciations(pronunciations, indexedPopularWords);

  console.log('Writing random words for CodeMirror');
  await writeSupportedWords(pronunciations);

  console.log('Finished!');
};

start().catch((reason) => {
  console.error('Failed to load pronunciations', reason);
  process.exit(1);
});
