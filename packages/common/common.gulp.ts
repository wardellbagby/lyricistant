import { promises as fs } from 'fs';
import { dest, series, src } from 'gulp';
import ts from 'gulp-typescript';

import { getOutputDirectory as getOutDir } from '@tooling/common-tasks.gulp';

const outputDirectory = getOutDir('production', __dirname);

const cleanCommon = async () => {
  await fs.rmdir(outputDirectory, { recursive: true });
};

const compileCommonTS = () =>
  src(`${__dirname}/main/**/*.ts`)
    .pipe(ts.createProject(`${__dirname}/tsconfig.json`)())
    .pipe(dest(`${__dirname}/dist`));

export const buildCommon = series(cleanCommon, compileCommonTS);
