import { InitialOptionsTsJest } from 'ts-jest';

const config = async (): Promise<InitialOptionsTsJest> => ({
  verbose: true,
  projects: [
    'packages/codemirror/test',
    'packages/core-dom-platform/test',
    'packages/common-platform/test',
    'packages/renderer/test',
    'packages/rhyme-generator/test',
    'apps/electron/test/unit',
    'apps/electron/test/ui',
    'apps/web/test/',
  ],
  rootDir: '.',
});

export default config;
