import { wrap } from 'comlink';

/*
 When running in Node (for Jest tests), this can't be import.meta.url since
 those tests compile to CommonJS so we use Webpack to replace this when we
 actually build for a browser. The default is because Jest doesn't offer a
 good way of also supplying this variable, so we need something to fallback
 onto. This should go away once we move to running tests as ES6.

 Yes, I hate it too.
*/
export const rhymeGenerator = wrap<typeof import('./rhyme-generator')>(
  new Worker(
    new URL(
      './rhyme-generator.ts',
      process.env.IMPORT_META_URL || 'file:///fake/location'
    ),
    {
      name: 'rhyme-generator',
    }
  )
);
