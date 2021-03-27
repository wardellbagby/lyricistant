import { promises as fs } from 'fs';
import { dest, series, src } from 'gulp';
import ts from 'gulp-typescript';

const cleanRenderer = async () => {
  await fs.rmdir(`${__dirname}/dist`, { recursive: true });
};

const compileRendererTS = () =>
  src([
    `${__dirname}/main/**/*.ts`,
    `${__dirname}/main/**/*.tsx`,
    '!**/*.config.ts',
    'types/*.ts',
  ])
    .pipe(ts.createProject(`${__dirname}/tsconfig.json`)())
    .pipe(dest(`${__dirname}/dist`));

export const buildRenderer = series(cleanRenderer, compileRendererTS);
