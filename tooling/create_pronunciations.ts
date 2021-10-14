#!/usr/bin/env -S node -r ./register-ts-node

import fs, { writeFileSync } from 'fs';
import path from 'path';
import axios from 'axios';
import popularWordsJson from './popular.json';

const popularWords: string[] = popularWordsJson as string[];

interface Output {
  [word: string]: { pr: string; p?: number };
}

const output: Output = {};

const loadCmuPronunciations = async () => {
  const cmuDictUrl =
    'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
  const response = await axios.get(cmuDictUrl);
  const data: string = response.data;
  return data
    .split('\n')
    .map((line) => [
      line.slice(0, line.indexOf(' ')).trim().toLowerCase(),
      line.slice(line.indexOf(' ') + 1),
    ]);
};

const loadAdditionalPronunciations = async () => {
  const data = await fs.promises.readFile(
    path.resolve(__dirname, 'additional_pronounciations.dict'),
    'utf8'
  );

  return data
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.replace('\t', ' '))
    .map((line) => [
      line.slice(0, line.indexOf(' ')).trim().toLowerCase(),
      line.slice(line.indexOf(' ') + 1),
    ]);
};

const writePronunciations = async (
  pronunciations: string[][],
  indexedPopularWords: Record<string, number>
) => {
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

const createIndexedPopularWords = async () => {
  const ret: Record<string, number> = Object.create(null);
  Object.keys(popularWords).forEach((key) => {
    const index = Number.parseInt(key, 10);
    ret[popularWords[index]] = index;
  });
  return ret;
};

start().catch((reason) => {
  console.error('Failed to load pronunciations', reason);
  process.exit(1);
});
