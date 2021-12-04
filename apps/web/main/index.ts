import { start } from '@web-renderer/index';

start().catch((reason: any) => {
  if (reason instanceof Error) {
    throw reason;
  }
  throw Error(`Could not load the renderer page: ${reason}`);
});
