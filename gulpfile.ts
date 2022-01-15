import { promisify } from 'util';
import path from 'path';
import { parallel, series } from 'gulp';
import { glob } from 'glob';
import del from 'del';
import { buildWeb } from './apps/web/web.gulp';
import { buildElectron } from './apps/electron/electron.gulp';
import { testWeb } from './apps/web/test/test.gulp';
import { testElectron } from './apps/electron/test/test.gulp';
import { testCodemirror } from './packages/codemirror/test/test.gulp';
import { testRenderer } from './packages/renderer/test/test.gulp';
import { testCommon } from './packages/common/test/test.gulp';
import { testCorePlatform } from './packages/core-platform/test/test.gulp';

export * from './apps/web/web.gulp';
export * from './apps/web/test/test.gulp';
export * from './apps/electron/electron.gulp';
export * from './apps/electron/test/test.gulp';
export * from './apps/mobile/mobile.gulp';
export * from './packages/common/test/test.gulp';
export * from './packages/codemirror/test/test.gulp';
export * from './packages/core-platform/test/test.gulp';
export * from './packages/renderer/test/test.gulp';

export const buildAll = parallel(buildWeb, buildElectron);

export const testCore = series(testCodemirror, testCommon, testRenderer);
export const testAllWeb = series(testWeb, testCore, testCorePlatform);
export const testAllElectron = series(testElectron, testCore);
export const testAll = series(
  testCorePlatform,
  testWeb,
  testElectron,
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
