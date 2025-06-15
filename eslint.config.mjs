import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import jest from 'eslint-plugin-jest';

export default tslint.config(
  eslint.configs.recommended,
  tslint.configs.recommended,
  {
    files: ['**/*.{(t|j)sx}'],
    ...react.configs.flat.recommended,
  },
  {
    ignores: [
      '!/.github',
      '**/dist/**/*',
      '**/build/**/*',
      '**/node_modules/**/*',
      'apps/mobile/android/**/*',
      'apps/mobile/ios/**/*',
    ],
  },
  {
    files: ['**/test/**/*.spec.{ts,tsx}'],
    plugins: { jest },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'jest/no-disabled-tests': 'error',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'off',
      'jest/valid-expect': 'error',
      'jest/no-standalone-expect': [
        'error',
        {
          additionalTestBlockFunctions: [
            'beforeEach',
            'beforeAll',
            'afterEach',
            'afterAll',
          ],
        },
      ],
    },
  },
  {
    files: [
      'tooling/**/*.js',
      'register-ts-node.js',
      '**/*.config.{js,ts}',
      'gulpfile.js',
      '**/.*rc.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  prettier,
);
