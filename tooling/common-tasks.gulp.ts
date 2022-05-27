import { ChildProcess, spawn as nodeSpawn, SpawnOptions } from 'child_process';
import path from 'path';
import { Config } from '@jest/types';
import del from 'del';
import { pathsToModuleNameMapper } from 'ts-jest';
import { defaults as tsjPreset } from 'ts-jest/presets';
import { compilerOptions } from '../tsconfig.json';

export const rootDirectory = path.resolve(__dirname, '..');
export type Mode = 'development' | 'production' | 'test';

export const getOutputDirectory = (mode: Mode, appDirectory: string) =>
  path.resolve(appDirectory, 'dist', mode);

export const cleanBuildDirectory = async () =>
  del(path.resolve(__dirname, '..', 'build'));

type TestType = 'node' | 'jsdom' | 'browser';
const getJestEnv = (type: TestType): string => {
  if (type === 'jsdom') {
    return require.resolve('./jsdom-jest-env');
  } else {
    return type;
  }
};
const getLabel = (type: TestType): string => {
  switch (type) {
    case 'node':
    case 'jsdom':
      return 'Unit';
    case 'browser':
      return 'UI';
    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

export const getBaseJestConfig = (options: {
  name: string;
  type: TestType;
}): Config.InitialOptions => {
  const baseConfig = {
    displayName: `${getLabel(options.type)} - ${options.name}`,
    verbose: true,
    detectOpenHandles: true,
  };
  if (options.type === 'browser') {
    return {
      ...baseConfig,
      rootDir: '.',
      preset: 'jest-playwright-preset',
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    };
  }
  return {
    ...baseConfig,
    testEnvironment: getJestEnv(options.type),
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleNameMapper: {
      '^.+\\.(css|scss)$': 'identity-obj-proxy',
      'typeface-.+': 'identity-obj-proxy',
      ...pathsToModuleNameMapper(compilerOptions.paths),
    },
    moduleDirectories: ['.', 'node_modules'],
    transform: {
      ...tsjPreset.transform,
    },
  };
};

export const jest = (project: string) =>
  spawn('npx', ['jest', '--projects', project]);

export const spawn = (
  command: string,
  args?: string[],
  options?: SpawnOptions
): ChildProcess => {
  const optionsWithCwd: SpawnOptions = {
    cwd: rootDirectory,
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
