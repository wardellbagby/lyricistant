import { ChildProcess, spawn as nodeSpawn, SpawnOptions } from 'child_process';
import path from 'path';
import { runCLI } from '@jest/core';
import del from 'del';

export type Mode = 'development' | 'production' | 'test';

export const getOutputDirectory = (mode: Mode, appDirectory: string) =>
  path.resolve(appDirectory, 'dist', mode);

export const cleanBuildDirectory = async () =>
  del(path.resolve(__dirname, '..', 'build'));

export const mocha = (pattern: string, options?: { bail?: boolean }) => {
  const args = [
    'mocha',
    '--require',
    './register-ts-node',
    options?.bail ? '--bail' : null,
    pattern,
  ].filter((it) => !!it);
  return spawn('npx', args, {
    cwd: path.resolve(__dirname, '..'),
  });
};

export const jest = async (directory: string) => {
  const { results } = await runCLI({ _: [], $0: 'jest', rootDir: directory }, [
    directory,
  ]);

  if (results.numTotalTests === 0) {
    throw new Error('Jest - No tests ran!');
  }

  if (results.wasInterrupted) {
    throw new Error('Jest - Interrupted before finish!');
  }

  if (!results.success) {
    throw new Error('Jest reported test failures.');
  }
};

export const spawn = (
  command: string,
  args?: string[],
  options?: SpawnOptions
): ChildProcess => {
  const optionsWithCwd: SpawnOptions = {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    ...options,
  };
  const childProcess = nodeSpawn(command, args, optionsWithCwd);

  console.log(`Running command: ${childProcess.spawnargs.join(' ')}`);

  childProcess.on('exit', (code) => {
    console.log('Process exited with code ' + code?.toString());
  });

  return childProcess;
};
