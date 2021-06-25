#!/usr/bin/env -S node -r ./register-ts-node

import { writeFileSync } from 'fs';
import cmuPronunciations from 'cmu-pronouncing-dictionary';
import popularWords from './popular.json';

interface Output {
  [word: string]: { pr: string; p?: number };
}
const output: Output = {};
for (const word in cmuPronunciations) {
  if (cmuPronunciations.hasOwnProperty(word)) {
    let popularity = popularWords.indexOf(word);
    if (popularity < 0) {
      popularity = undefined;
    }
    output[word] = {
      pr: (cmuPronunciations as Record<string, string>)[word],
      p: popularity,
    };
  }
}

writeFileSync(
  'packages/renderer/main/workers/pronunciations.json',
  JSON.stringify(output)
);
