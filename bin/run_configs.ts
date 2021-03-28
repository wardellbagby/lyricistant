import path from 'path';
import { snakeCase } from 'change-case';
import * as gulpFile from '../gulpfile';

const configFileName = (taskName: string) => `${snakeCase(taskName)}.xml`;

export const runConfigDirectory = path.resolve('.idea/runConfigurations');

export const getRunConfigFile = (taskName: string) =>
  path.resolve(runConfigDirectory, configFileName(taskName));

export const getGulpTasks = () => Object.keys(gulpFile).sort();
