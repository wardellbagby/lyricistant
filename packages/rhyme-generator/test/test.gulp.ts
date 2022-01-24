import { mocha } from '@tooling/common-tasks.gulp';

export const testRhymeGenerator = () =>
  mocha('packages/rhyme-generator/test/*.spec.ts');
