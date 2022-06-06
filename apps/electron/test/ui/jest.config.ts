require('tsconfig-paths/register');

import type { Config } from '@jest/types';
import { getBaseJestConfig } from '@tooling/common-tasks.gulp';

const config: Config.InitialOptions = {
  ...getBaseJestConfig({
    name: 'Electron',
    type: 'browser',
  }),
};

export default config;
