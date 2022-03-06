import { mocha } from '@tooling/common-tasks.gulp';

export const testCommonPlatform = () => mocha(`${__dirname}/**/*.spec.ts`);
