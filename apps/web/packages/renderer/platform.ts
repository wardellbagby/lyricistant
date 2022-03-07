import { Platform } from '@web-common/Platform';
import { wrap } from 'comlink';

export const mainProcessWorker = new Worker(
  new URL(
    '@web-platform/index',
    process.env.IMPORT_META_URL || 'file:///fake/location'
  ),
  {
    name: 'platform',
  }
);

export const platform: Platform = wrap(mainProcessWorker);
