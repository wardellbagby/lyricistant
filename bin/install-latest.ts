#!/usr/bin/env -S node -r ./register-ts-node

import { spawnSync } from 'child_process';
import { devDependencies, dependencies } from '../package.json';

const filter = process.argv[2];
const version = process.argv[3] ?? 'latest';

const depsToUpdate = Object.keys(dependencies)
  .concat(Object.keys(devDependencies))
  .filter((it) => it.startsWith(filter));

console.log(
  `Updating deps: \n\n${depsToUpdate.join('\n')} \n\nto version: ${version}`
);
spawnSync(
  'npm',
  ['install'].concat(depsToUpdate.map((it) => `${it}@${version}`)),
  {
    stdio: 'inherit',
  }
);
