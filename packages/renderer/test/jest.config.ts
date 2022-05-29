require('tsconfig-paths/register');

import type { Config } from '@jest/types';
import { getBaseJestConfig } from '@tooling/common-tasks.gulp';

const config: Config.InitialProjectOptions = {
  ...getBaseJestConfig({
    name: 'Renderer',
    type: 'jsdom',
  }),
  testPathIgnorePatterns: ['build'],
};

export default config;
