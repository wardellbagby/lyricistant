import { jest } from '@tooling/common-tasks.gulp';
import { series } from 'gulp';
import { buildTestWeb } from '../web.gulp';

const uiTestWeb = () => jest(__dirname);

export const testWeb = series(buildTestWeb, uiTestWeb);
