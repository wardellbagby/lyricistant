import { mocha } from '@tooling/common-tasks.gulp';

export const testCodemirror = () => mocha('packages/codemirror/test/*.spec.ts');
