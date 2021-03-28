import { series, src } from 'gulp';
import mocha from 'gulp-mocha';
import { buildTestElectron } from '../electron.gulp';

const testElectronMocha = () =>
  src(['apps/electron/test/**/*.spec.ts']).pipe(
    mocha({
      // @ts-ignore Types don't have require yet.
      require: ['./register-ts-node'],
    })
  );

export const testElectron = series(buildTestElectron, testElectronMocha);
