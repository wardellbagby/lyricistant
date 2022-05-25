import { InitialOptionsTsJest } from 'ts-jest';

const config = async (): Promise<InitialOptionsTsJest> => ({
  verbose: true,
  projects: [
    'packages/codemirror/test',
    'packages/core-dom-platform/test',
    'packages/common-platform/test',
    'packages/rhyme-generator/test',
    'apps/electron/test/unit',
  ],
  rootDir: '.',
});

export default config;
