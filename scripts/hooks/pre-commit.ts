#!/usr/bin/env -S node -r ./register-ts-node

import { spawnSync as nodeSpawnSync, SpawnSyncOptions } from 'child_process';
import * as path from 'path';

const spawnSync = (
  command: string,
  args?: string[],
  options?: SpawnSyncOptions
) => {
  const result = nodeSpawnSync(command, args, {
    cwd: path.resolve(__dirname, '../../'),
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    console.log(result.stdout.toString());
    console.error(result.stderr.toString());
    process.exit(result.status);
  }
};
const changeableFiles = [
  'apps/mobile/android/capacitor.settings.gradle',
  'apps/mobile/android/app/capacitor.build.gradle',
  'apps/mobile/ios/App/Podfile',
  '.github/workflows',
  '.idea/runConfigurations',
  '.vscode/launch.json',
];
spawnSync('npx', ['cap', 'update', 'android']);
spawnSync('npx', ['cap', 'update', 'ios']);
spawnSync('./scripts/create_workflows.ts');
spawnSync('./scripts/check/run_configs.ts', ['--fix']);
spawnSync('git', ['add', ...changeableFiles]);
