#!/usr/bin/env -S node -r ./register-ts-node
import * as fs from 'fs';
import { getGulpTasks, getRunConfigFile } from './run_configs';

getGulpTasks().forEach((taskName) => {
  const file = getRunConfigFile(taskName);
  const result = fs.existsSync(file);
  if (!result) {
    console.error(
      `Expected "${file}" to exist for task "${taskName}", but it does not! Try running "npm run lint-fix" to generate it.`
    );
    process.exit(1);
  }
});
