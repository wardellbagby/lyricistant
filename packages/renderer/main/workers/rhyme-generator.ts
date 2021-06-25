import { Rhyme } from '@lyricistant/renderer/models/rhyme';

export const generateRhymes = (word: string): Rhyme[] => [
  {
    word,
    score: 100,
  },
  {
    word: 'Yello',
    score: 10,
  },
];
