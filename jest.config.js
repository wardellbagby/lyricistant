const { defaults: tsjPreset } = require('ts-jest/presets');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  testEnvironment: require.resolve('./default-jest-env.js'),
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
  verbose: true,
};
