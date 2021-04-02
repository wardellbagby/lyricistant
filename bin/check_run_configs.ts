#!/usr/bin/env -S node -r ./register-ts-node
import * as fs from 'fs';
import {
  getGulpTasks,
  getIDEARunConfigFile,
  vsCodeLaunchFile,
} from './run_configs';

const vsCodeLaunch = JSON.parse(fs.readFileSync(vsCodeLaunchFile, 'utf8'));

const verifyVSCodeTask = (taskName: string): boolean =>
  vsCodeLaunch['configurations']
    .map((config: Record<string, any>) => config.args[0])
    .includes(taskName);
const verifyIDEATask = (taskName: string): boolean => {
  const file = getIDEARunConfigFile(taskName);
  return (
    fs.existsSync(file) &&
    fs.readFileSync(file, 'utf8').includes(`<task>${taskName}</task>`)
  );
};

const fail = (taskName: string, type: string) => {
  console.error(
    `${type}: Missing run configuration for task "${taskName}". Try running "npm run lint-fix" to generate it.`
  );
};

getGulpTasks().forEach((taskName) => {
  if (!verifyIDEATask(taskName)) {
    fail(taskName, 'IDEA');
  }
  if (!verifyVSCodeTask(taskName)) {
    fail(taskName, 'VS Code');
  }
});
