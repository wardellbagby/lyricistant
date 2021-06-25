#!/usr/bin/env -S node -r ./register-ts-node

import { writeFileSync } from 'fs';
import cmuPronunciations from 'cmu-pronouncing-dictionary';
import popularWords from './popular.json';

const includes = <T>(list: T[], value: T): boolean => {
  let start = 0;
  let end = list.length - 1;

  while (start <= end) {
    const pivot = Math.floor((start + end) / 2);

    if (list[pivot] === value) {
      return true;
    } else if (value > list[pivot]) {
      start = pivot + 1;
    } else {
      end = pivot - 1;
    }
  }
  return false;
};

interface Output {
  [word: string]: { pr: string; p?: number };
}
const output: Output = {};
for (const word in cmuPronunciations) {
  if (cmuPronunciations.hasOwnProperty(word)) {
    output[word] = {
      pr: (cmuPronunciations as Record<string, string>)[word],
      p: (includes(popularWords, word) && 1) || undefined,
    };
  }
}

writeFileSync(
  'packages/renderer/main/workers/pronunciations.json',
  JSON.stringify(output)
);
