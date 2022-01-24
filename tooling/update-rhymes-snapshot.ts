#!/usr/bin/env -S node -r ./register-ts-node

import path from 'path';
import { writeFileSync } from 'fs';
import { generateRhymes } from '@lyricistant/rhyme-generator/rhyme-generator';

const words = [
  'hello',
  "don't",
  'chandler',
  'flourish',
  'tough',
  'division',
  'exaggerate',
  'abundant',
  'slogan',
  'fame',
  'disagreement',
  'feeling',
  'slam',
  'solo',
  'ordinary',
  'homie',
  'nihilism',
  'bashaw',
  'giraffes',
  'gyrating',
  'unskilled',
  'blogging',
  'cyclamen',
  'reed',
  'purveying',
  'rundle',
  'die',
  'ambassadorship',
];

const output = path.resolve(
  'packages',
  'rhyme-generator',
  'test',
  'snapshot.json'
);

const result: Record<string, any> = {};

words.forEach((word) => {
  const rhymes = generateRhymes(word);
  if (rhymes.length === 0) {
    throw new Error(`No rhymes for ${word}; exiting...`);
  }
  result[word] = rhymes;
});

writeFileSync(output, JSON.stringify(result, null, 2));
