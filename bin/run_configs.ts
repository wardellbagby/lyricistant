import path from 'path';
import fs from 'fs';
import { capitalCase, snakeCase } from 'change-case';
import * as gulpFile from '../gulpfile';

const ideaConfigFileName = (taskName: string) => `${snakeCase(taskName)}.xml`;

const ideaRunConfigDirectory = path.resolve('.idea/runConfigurations');

export const clearIdeaDirectories = () => {
  fs.rmdirSync(ideaRunConfigDirectory, { recursive: true });
  fs.mkdirSync(ideaRunConfigDirectory);
};
export const clearVSCodeDirectories = () => {
  const vsCodeDirectory = path.resolve(vsCodeLaunchFile, '..');
  if (!fs.existsSync(vsCodeDirectory)) {
    fs.mkdirSync(path.resolve(vsCodeLaunchFile, '..'));
  }
};

const groupings = ['build', 'open', 'start', 'test'];
export const getGroup = (taskName: string): string => {
  for (const group of groupings) {
    if (taskName.startsWith(group)) {
      return capitalCase(group);
    }
  }
  return null;
};
export const getIDEARunConfigFile = (taskName: string) =>
  path.resolve(ideaRunConfigDirectory, ideaConfigFileName(taskName));

export const vsCodeLaunchFile = path.resolve('.vscode/launch.json');

export const getGulpTasks = () => Object.keys(gulpFile).sort();
