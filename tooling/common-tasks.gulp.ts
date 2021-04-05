import { ChildProcess, spawn as nodeSpawn, SpawnOptions } from 'child_process';
import path from 'path';
import { runCLI } from '@jest/core';

export type Mode = 'development' | 'production' | 'test';

export const getOutputDirectory = (mode: Mode, appDirectory: string) => {
  switch (mode) {
    case 'development':
      return path.resolve(appDirectory, 'dist/development');
    case 'production':
      return path.resolve(appDirectory, 'dist/production');
    case 'test':
      return path.resolve(appDirectory, 'dist/test');
  }
};

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
  const optionsWithCwd = {
    cwd: path.resolve(__dirname, '..'),
    ...options,
  };
  const childProcess = nodeSpawn(command, args, optionsWithCwd);

  console.log(`Running command: ${childProcess.spawnargs.join(' ')}`);
  console.log(`Options: ${JSON.stringify(optionsWithCwd)}`);

  childProcess.stdout?.on('data', (data) => {
    process.stdout.write(data);
  });
  childProcess.stderr?.on('data', (data) => {
    console.log(data.toString());
  });
  childProcess.on('exit', (code) => {
    console.log('Process exited with code ' + code.toString());
  });

  return childProcess;
};
