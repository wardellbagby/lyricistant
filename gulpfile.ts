import path from 'path';
import { promisify } from 'util';
import del from 'del';
import { glob } from 'glob';
import { parallel, series } from 'gulp';
import { buildElectron } from './apps/electron/electron.gulp';
import { testElectron } from './apps/electron/test/test.gulp';
import { buildScreenshotter } from './apps/screenshotter/screenshotter.gulp';
import { testWeb } from './apps/web/test/test.gulp';
import { buildWeb } from './apps/web/web.gulp';
import { testCodemirror } from './packages/codemirror/test/test.gulp';
import { testCommonPlatform } from './packages/common-platform/test/test.gulp';
import { testCoreDOMPlatform } from './packages/core-dom-platform/test/test.gulp';
import { testRenderer } from './packages/renderer/test/test.gulp';
import { testRhymeGenerator } from './packages/rhyme-generator/test/test.gulp';

export * from './apps/web/web.gulp';
export * from './apps/web/test/test.gulp';
export * from './apps/electron/electron.gulp';
export * from './apps/electron/test/test.gulp';
export * from './apps/mobile/mobile.gulp';
export * from './apps/screenshotter/screenshotter.gulp';
export * from './packages/codemirror/test/test.gulp';
export * from './packages/common-platform/test/test.gulp';
export * from './packages/core-dom-platform/test/test.gulp';
export * from './packages/renderer/test/test.gulp';
export * from './packages/rhyme-generator/test/test.gulp';

export const buildAll = parallel(buildWeb, buildElectron);

export const testCore = series(
  testCodemirror,
  testCommonPlatform,
  testRhymeGenerator,
  testRenderer
);
export const testAllWeb = series(testWeb, testCore, testCoreDOMPlatform);
export const testAllElectron = series(testElectron, testCore);
export const testAll = series(
  testCoreDOMPlatform,
  testWeb,
  testElectron,
  buildScreenshotter,
  testCore
);

export const clean = async () => {
  const tsConfigs = await promisify(glob)('!(node_modules)/*/tsconfig.json');

  tsConfigs
    .map((tsConfig) => path.resolve(path.dirname(tsConfig), 'build'))
    .forEach((buildDir) => {
      console.log(`Cleaning ${buildDir}`);
      del.sync(buildDir);
    });
};
export const check = parallel(buildAll, testAll);
