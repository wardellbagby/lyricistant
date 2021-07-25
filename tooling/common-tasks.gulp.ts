import { ChildProcess, spawn as nodeSpawn, SpawnOptions } from 'child_process';
import path from 'path';
import { runCLI } from '@jest/core';
import del from 'del';

export type Mode = 'development' | 'production' | 'test';

export const getOutputDirectory = (mode: Mode, appDirectory: string) =>
  path.resolve(appDirectory, 'dist', mode);

export const cleanBuildDirectory = async () =>
  del(path.resolve(__dirname, '..', 'build'));

export const jest = async (directory: string) => {
  runCLI({ _: [], $0: 'jest', rootDir: directory }, [directory]).then(
    ({ results }) => {
      if (results.numFailedTests > 0) {
        throw new Error('Jest reported test failures.');
      }
      if (results.numTotalTests === 0) {
        throw new Error('Jest - No tests ran!');
      }
    }
  );
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
    console.log('Process exited with code ' + code.toString());
  });

  return childProcess;
};
