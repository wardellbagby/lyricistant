import { ChildProcess, spawn as nodeSpawn, SpawnOptions } from 'child_process';
import path from 'path';
import { Config } from '@jest/types';
import { deleteAsync as del } from 'del';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../tsconfig.json';

export const rootDirectory = path.resolve(__dirname, '..');
export type Mode = 'development' | 'production' | 'test';

export const getOutputDirectory = (mode: Mode, appDirectory: string) =>
  path.resolve(appDirectory, 'dist', mode);

export const cleanBuildDirectory = () =>
  del(path.resolve(__dirname, '..', 'build'));

type TestType = 'node' | 'jsdom' | 'browser';
const getJestEnv = (type: TestType): string => {
  if (type === 'jsdom') {
    return require.resolve('./jsdom-jest-env');
  } else {
    return 'node';
  }
};

const modulesToTransform = [
  'retext',
  'retext-spell',
  'unified',
  'bail',
  'is-plain-obj',
  'trough',
  'vfile',
  'unist-util-stringify-position',
  'unherit',
  'parse-latin',
  'nlcst-to-string',
  'unist-util-modify-children',
  'array-iterate',
  'unist-util-visit-children',
  'unist-util-visit',
  'unist-util-is',
  'unist-util-position',
  'nlcst-is-literal',
  'quotation',
  '@octokit/.+',
  'universal-user-agent',
  'before-after-hook',
  'devlop',
  'react-error-boundary',
];

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

const getTimeout = (type: TestType): number => {
  if (type === 'browser') {
    if (process.env.CI) {
      return 60_000;
    }
    if (process.env.PWDEBUG) {
      return 999_999_999;
    }
    return 15_000;
  }
  if (process.env.CI) {
    return 30_000;
  }

  return 10_000;
};

export const getBaseJestConfig = (options: {
  name: string;
  type: TestType;
}): Config.InitialOptions => {
  const baseConfig: Config.InitialOptions = {
    displayName: `${getLabel(options.type)} - ${options.name}`,
    verbose: true,
    moduleNameMapper: {
      ...pathsToModuleNameMapper(compilerOptions.paths),
      '^lodash-es$': 'lodash',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleDirectories: [rootDirectory, 'node_modules'],
    testTimeout: getTimeout(options.type),
    setupFilesAfterEnv: [
      'jest-extended/all',
      path.resolve(__dirname, 'jest-test-setup.ts'),
    ],
  };

  if (options.type === 'browser') {
    return {
      ...baseConfig,
      setupFilesAfterEnv: [
        ...baseConfig.setupFilesAfterEnv,
        path.resolve(__dirname, 'browser-test-setup.js'),
      ],
      rootDir: '.',
      transform: {
        '^.+\\.ts$': 'ts-jest',
        '\\.jsx?$': 'babel-jest',
      },
    };
  }
  return {
    ...baseConfig,
    moduleNameMapper: {
      // The order here matters. First match is always picked.
      '^.+\\.(png|css|scss)$': 'identity-obj-proxy',
      '^.+\\.svg$': path.resolve(__dirname, 'jest-svg-mock.js'),
      '^.+\\.grammar$': path.resolve(__dirname, 'grammar-mock.js'),
      ...baseConfig.moduleNameMapper,
    },
    testEnvironment: getJestEnv(options.type),
    fakeTimers: {
      advanceTimers: true,
      enableGlobally: true,
    },
    transformIgnorePatterns: [
      `.*/?node_modules/(?!${modulesToTransform.join('|')})`,
    ],
    transform: {
      '\\.[jt]sx?$': 'ts-jest',
    },
  };
};

export const jest = (project: string, env?: NodeJS.ProcessEnv) =>
  spawn('npx', ['jest', '--projects', project], {
    env: {
      ...env,
      NODE_OPTIONS: '--no-deprecation',
    },
  });

export const spawn = (
  command: string,
  args?: string[],
  options?: SpawnOptions,
): ChildProcess => {
  const optionsWithCwd: SpawnOptions = {
    cwd: rootDirectory,
    stdio: 'inherit',
    ...options,
    env: {
      ...process.env,
      ...options?.env,
    },
  };
  const childProcess = nodeSpawn(command, args, optionsWithCwd);

  console.log(`Running command: ${childProcess.spawnargs.join(' ')}`);

  childProcess.on('exit', (code) => {
    console.log('Process exited with code ' + code?.toString());
  });

  return childProcess;
};
