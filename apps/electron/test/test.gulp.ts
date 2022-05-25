import path from 'path';
import { jest } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestElectron } from '../electron.gulp';

const uiTestElectron = () => jest(path.resolve(__dirname, 'ui'));
const unitTestElectron = () => jest(path.resolve(__dirname, 'unit'));

export const testElectron = series(
  unitTestElectron,
  buildTestElectron,
  uiTestElectron
);
