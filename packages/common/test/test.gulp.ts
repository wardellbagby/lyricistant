import { mocha } from '@tooling/common-tasks.gulp';

export const testCommon = () => mocha(`${__dirname}/**/*.spec.ts`);
