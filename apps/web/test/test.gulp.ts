import { mocha } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestWeb } from '../web.gulp';

const testWebMocha = () => mocha('apps/web/test/*.spec.ts');

export const testWeb = series(buildTestWeb, testWebMocha);
