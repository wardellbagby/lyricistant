import { generateRhymes } from '@lyricistant/rhyme-generator/rhyme-generator';
import { expose } from 'comlink';

// Separate the usage of Comlink from the rhyme-generator itself for easier testing.
expose({
  generateRhymes,
});
