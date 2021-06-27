import { wrap } from 'comlink';

export const rhymeGenerator = wrap<typeof import('./rhyme-generator')>(
  new Worker(new URL('./rhyme-generator.ts', import.meta.url))
);
