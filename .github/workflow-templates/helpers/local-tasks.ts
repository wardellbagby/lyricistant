import * as gulpfile from '../../../gulpfile';
import { scripts } from '../../../package.json';
export const gulp = (task: keyof typeof gulpfile) =>
  `gulp ${task} --max-old-space-size=8192`;

export const npm = (task: keyof typeof scripts) => `npm run ${task}`;
