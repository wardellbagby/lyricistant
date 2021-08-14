#!/usr/bin/env -S node -r ./register-ts-node

import { writeFileSync } from 'fs';
import axios from 'axios';
import popularWords from './popular.json';

interface Output {
  [word: string]: { pr: string; p?: number };
}
const output: Output = {};

const loadPronunciations = async () => {
  const cmuDictUrl =
    'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
  const response = await axios.get(cmuDictUrl);
  const data: string = response.data;
  return data
    .split('\n')
    .map((line) => [
      line.slice(0, line.indexOf(' ')),
      line.slice(line.indexOf(' ') + 1),
    ]);
};

const writePronunciations = async (pronunciations: string[][]) => {
  for (const [word, pronunciation] of pronunciations) {
    let popularity = popularWords.indexOf(word);
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

const start = async () => {
  await writePronunciations(await loadPronunciations());
};

start().catch((reason) => {
  console.error('Failed to load pronunciations', reason);
  process.exit(1);
});
