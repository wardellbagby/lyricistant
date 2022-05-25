require('tsconfig-paths/register');

import type { Config } from '@jest/types';
import { getBaseJestConfig } from '@tooling/common-tasks.gulp';

const config: Config.InitialProjectOptions = {
  ...getBaseJestConfig({
    name: 'Rhyme Generator',
    type: 'node',
  }),
};

export default config;
