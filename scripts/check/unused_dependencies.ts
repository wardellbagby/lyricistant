#!/usr/bin/env -S node -r ./register-ts-node

import * as path from 'path';
import depcheck, { Options, Results } from 'depcheck';
import { dependencies, devDependencies } from '../../package.json';

// Typesync handles making sure the @types deps are put together, so ignore those.
const TYPES_MATCH = '@types/*';

const options: Options = {
  skipMissing: false,
  ignoreDirs: ['dist'],
  parsers: {
    '**/*.js': depcheck.parser.es6,
    '**/*.ts': depcheck.parser.typescript,
    '**/*.tsx': depcheck.parser.typescript,
  },
  detectors: [
    depcheck.detector.requireCallExpression,
    depcheck.detector.importDeclaration,
    depcheck.detector.importCallExpression,
    depcheck.detector.exportDeclaration,
    depcheck.detector.typescriptImportType,
    depcheck.detector.typescriptImportEqualsDeclaration,
  ],
  specials: [
    depcheck.special.eslint,
    depcheck.special.webpack,
    depcheck.special.mocha,
    depcheck.special.react17,
    depcheck.special.ttypescript,
    depcheck.special.karma,
    depcheck.special.prettier,
    depcheck.special.tslint,
    depcheck.special.husky,
  ],
  ignoreMatches: [
    TYPES_MATCH,
    '@capacitor/android',
    '@capacitor/filesystem',
    '@capacitor/ios',
    '@capacitor/keyboard',
    'css-loader',
    'eslint-plugin-prettier',
    'file-loader',
    'mocha',
    'style-loader',
    'ts-loader',
    'raw-loader',
    '@svgr/webpack',
    'ttypescript',
    'url-loader',
    'tslib',
    '@fontsource/roboto',
    '@fontsource/roboto-mono',
    '@commitlint/cli',
    '@commitlint/config-conventional',
    'commitizen',
    'cz-conventional-changelog',
    'standard-changelog',
    'karma-webpack',
    'karma-mocha',
    'karma-chrome-launcher',
    'karma-spec-reporter',
    'karma-viewport',
    'typesync',
    'jest-playwright-preset',
    'prettier-plugin-jsdoc',
    'blob-polyfill',
    'identity-obj-proxy',
  ],
};

const logIfExists = (
  label: string,
  values: string[] | Record<string, string>
) => {
  if (check(values)) {
    console.log(label);
    if (Array.isArray(values)) {
      values.forEach((dep) => {
        console.log(dep);
      });
    } else {
      Object.keys(values).forEach((key) => {
        console.log(`${key} - ${values[key]}`);
      });
    }
    console.log();
  }
};

const check = (value: any) => value && Object.keys(value).length > 0;

depcheck(path.resolve(__dirname, '../../'), options).then(
  ({
    dependencies: unusedDeps,
    devDependencies: unusedDevDeps,
    invalidFiles,
    invalidDirs,
  }: Results) => {
    logIfExists('Unused dependencies:', [...unusedDeps, ...unusedDevDeps]);
    logIfExists("Files that couldn't be checked:", invalidFiles);
    logIfExists("Directories that couldn't be checked:", invalidDirs);

    if (
      check(unusedDeps) ||
      check(unusedDevDeps) ||
      check(invalidFiles) ||
      check(invalidDirs)
    ) {
      process.exit(1);
    }
  }
);

options.ignoreMatches.forEach((dep) => {
  if (dep === TYPES_MATCH) {
    return;
  }
  if (!(dep in dependencies || dep in devDependencies)) {
    console.log(
      `"${dep}" is explicitly ignored from dependency checks but is no longer installed. Please remove from "scripts/check/unsued_dependencies.ts"`
    );
  }
});
