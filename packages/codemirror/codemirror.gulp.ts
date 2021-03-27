import { promises as fs } from 'fs';
import { dest, series, src } from 'gulp';
import ts from 'gulp-typescript';

const cleanCodeMirror = async () => {
  await fs.rmdir(`${__dirname}/dist`, { recursive: true });
};

const compileCodeMirrorTS = () =>
  src([`${__dirname}/main/**/*.ts`, `${__dirname}/main/**/*.tsx`, 'types/*.ts'])
    .pipe(ts.createProject(`${__dirname}/tsconfig.json`)())
    .pipe(dest(`${__dirname}/dist`));

export const buildCodeMirror = series(cleanCodeMirror, compileCodeMirrorTS);
