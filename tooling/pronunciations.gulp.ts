import path from 'path';
import { spawn } from '@tooling/common-tasks.gulp';

export const generatePronunciations = async () => {
  spawn(path.resolve(__dirname, 'create_pronunciations.ts'));
};
