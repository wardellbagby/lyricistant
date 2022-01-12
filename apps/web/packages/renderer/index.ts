import { expose, proxy, transfer } from 'comlink';
import { fileOpen, fileSave } from 'browser-fs-access';
import { Storage } from '@web-common/Storage';
import { BufferFileSystem } from '@web-common/BufferFileSystem';
import { platformDelegate } from './PlatformDelegate';
import { mainProcessWorker, platform } from './platform';

window.platformDelegate = platformDelegate;

export const receive = (channel: string, args: any[]) => {
  platformDelegate.receive(channel, args);
};

const getFileSystem: () => BufferFileSystem = () =>
  proxy({
    saveFile: async (buffer, defaultFileName: string, handle) => {
      const result = await fileSave(
        new Blob([buffer]),
        {
          fileName: defaultFileName,
        },
        handle
      );
      return {
        path: result.name,
      };
    },
    openFile: async () => {
      try {
        const result = await fileOpen({ extensions: ['.lyrics', '.txt'] });
        const data = await result.arrayBuffer();
        return {
          path: result.name,
          data: transfer(data, [data]),
          handle: result.handle,
        };
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          logger.verbose(
            'Swallowing exception since user closed the open file picker',
            e
          );
        } else {
          throw e;
        }
      }
    },
  });

const getLocalStorage: () => Storage = () => proxy(localStorage);
const getSessionStorage: () => Storage = () => proxy(sessionStorage);
const showConfirmDialog = (message?: string) => confirm(message);

expose(
  {
    receive,
    getFileSystem,
    getLocalStorage,
    getSessionStorage,
    showConfirmDialog,
  },
  mainProcessWorker
);

export const start = async () => {
  window.logger = await platform.getLogger();
  window.logger.info('Platform information', {
    appPlatform: 'Web',
    version:
      (await import('@lyricistant/renderer/globals')).APP_VERSION ?? 'Error',
    userAgent: navigator.userAgent,
  });

  await platform.start();
  await import('@lyricistant/renderer/index');
};
