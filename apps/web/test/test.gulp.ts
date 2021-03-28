import { parallel, series, src } from 'gulp';
import mocha from 'gulp-mocha';
import { buildTestWeb } from '../web.gulp';
import { testWebPlatform } from './platform/test.gulp';

const testWebMocha = () =>
  src(['apps/web/test/*.spec.ts']).pipe(
    mocha({
      // @ts-ignore Types don't have require yet.
      require: ['./register-ts-node'],
    })
  );

export const testWeb = parallel(
  series(buildTestWeb, testWebMocha),
  testWebPlatform
);
