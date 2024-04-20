import path from 'path';
import { jest } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestElectron } from '../electron.gulp';

const runElectronUiTests = () => jest(path.resolve(__dirname, 'ui'));

export const uiTestElectron = series(buildTestElectron, runElectronUiTests);
export const unitTestElectron = () => jest(path.resolve(__dirname, 'unit'));
export const testElectron = series(unitTestElectron, uiTestElectron);
