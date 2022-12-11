import { jest } from '@tooling/common-tasks.gulp';
import { parallel, series } from 'gulp';
import { buildTestWeb } from '../web.gulp';
import { getTotalShardCount, webUiTestShardEnv } from './ui-test-specs';

const runUiTest = (shard: number) => {
  const test = () => jest(__dirname, { [webUiTestShardEnv]: shard.toString() });
  test.displayName = `uiTestShard${shard}`;
  return test;
};

const createUiTestRunner = () => {
  const totalCount = getTotalShardCount();
  const tests = [];

  for (let i = 1; i <= totalCount; i++) {
    tests.push(runUiTest(i));
  }

  return parallel(...tests);
};

export const testWeb = series(buildTestWeb, createUiTestRunner());
