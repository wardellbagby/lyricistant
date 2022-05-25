import path from 'path';
import { mocha, jest } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestElectron } from '../electron.gulp';

const testElectronUiMocha = () => mocha('apps/electron/test/ui/**/*.spec.ts');
const testElectronUnitMocha = () => jest(path.resolve('unit'));

export const testElectron = series(
  testElectronUnitMocha,
  buildTestElectron,
  testElectronUiMocha
);
