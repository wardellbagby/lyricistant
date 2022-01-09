import { series } from 'gulp';
import { mocha } from '@tooling/common-tasks.gulp';
import { buildTestElectron } from '../electron.gulp';

const testElectronMocha = () => mocha('apps/electron/test/**/*.spec.ts');

export const testElectron = series(buildTestElectron, testElectronMocha);
