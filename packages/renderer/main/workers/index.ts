import { createWorkerFactory } from '@shopify/web-worker';

export const rhymeGenerator = createWorkerFactory(
  () => import('./rhyme-generator')
)();
