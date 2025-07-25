#!/usr/bin/env -S node -r ./register-ts-node

import { writeFileSync } from 'fs';
import path from 'path';
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
  'read',
  'authentic',
  'beatrice',
  'graduates',
];

const output = path.resolve(
  'packages',
  'rhyme-generator',
  'test',
  'snapshot.json',
);

const result: Record<string, unknown> = {};

words.forEach((word) => {
  const rhymes = generateRhymes(word);
  if (rhymes.length === 0) {
    throw new Error(`No rhymes for ${word}; exiting...`);
  }
  result[word] = rhymes;
});

writeFileSync(output, JSON.stringify(result, null, 2));
