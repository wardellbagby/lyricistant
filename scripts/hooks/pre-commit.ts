#!/usr/bin/env -S node -r ./register-ts-node

import { spawnSync as nodeSpawnSync, SpawnSyncOptions } from 'child_process';
import * as path from 'path';

const spawnSync = (
  command: string,
  args?: string[],
  options?: SpawnSyncOptions
) =>
  nodeSpawnSync(command, args, {
    cwd: path.resolve(__dirname, '../../'),
    ...options,
  });
const changableFiles = [
  'apps/mobile/android/capacitor.settings.gradle',
  'apps/mobile/android/app/capacitor.build.gradle',
  'apps/mobile/android/capacitor-cordova-android-plugins/cordova.variables.gradle',
  'apps/mobile/ios/App/Podfile',
  'apps/mobile/ios/capacitor-cordova-ios-plugins',
];
spawnSync('npx', ['cap', 'update', 'android']);
spawnSync('npx', ['cap', 'update', 'ios']);
spawnSync('git', ['add', ...changableFiles]);
