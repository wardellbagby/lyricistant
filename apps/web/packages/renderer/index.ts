import { BufferFileSystem } from '@web-common/BufferFileSystem';
import { Storage } from '@web-common/Storage';
import { fileOpen, fileSave, FileSystemHandle } from 'browser-fs-access';
import { expose, proxy, transfer } from 'comlink';
import { mainProcessWorker, platform } from './platform';
import { platformDelegate } from './PlatformDelegate';

window.platformDelegate = platformDelegate;
window.onerror = () => {
  alert(
    [
      'Sorry, Lyricistant has crashed! Please close this page and contact the developers.',
      'Continuing to use Lyricistant may result in undesired behavior.',
      '',
      `App version: ${process.env.APP_VERSION}`,
      `Homepage: ${process.env.APP_HOMEPAGE}`,
    ].join('\n')
  );
};
window.onunhandledrejection = (event) => window.onerror(event.reason);

export const receive = (channel: string, args: any[]) => {
  platformDelegate.receive(channel, args);
};

// Remove this when Typescript types start including the queryPermission and
// requestPermission properties.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface FileSystemFileHandle extends FileSystemHandle {}
}

const getFileSystem: () => BufferFileSystem = () =>
  proxy({
    saveFile: async (buffer, defaultFileName: string, handle) =>
      await fileSave(
        new Blob([buffer]),
        {
          fileName: defaultFileName,
        },
        handle
      ),
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
const onError = (reason: any) => {
  window.onerror(reason);
};

expose(
  {
    receive,
    getFileSystem,
    getLocalStorage,
    getSessionStorage,
    showConfirmDialog,
    onError,
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
