import type { Config } from '@jest/types';

const config = async (): Promise<Config.InitialOptions> => ({
  verbose: true,
  projects: ['packages/core-dom-platform/test'],
  rootDir: '.',
});

export default config;
