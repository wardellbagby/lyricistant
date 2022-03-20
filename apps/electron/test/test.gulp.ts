import { mocha } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestElectron } from '../electron.gulp';

const testElectronUiMocha = () => mocha('apps/electron/test/ui/**/*.spec.ts');
const testElectronUnitMocha = () =>
  mocha('apps/electron/test/unit/**/*.spec.ts');

export const testElectron = series(
  testElectronUnitMocha,
  buildTestElectron,
  testElectronUiMocha
);
