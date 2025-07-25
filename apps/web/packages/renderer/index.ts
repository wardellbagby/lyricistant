import { SUPPORTED_EXTENSIONS } from '@lyricistant/common-platform/files/Files';
import { runIgnoringAbortErrors } from '@lyricistant/core-dom-platform/platform/DOMFiles';
import { BufferFileSystem } from '@web-common/BufferFileSystem';
import { Storage } from '@web-common/Storage';
import { fileOpen, fileSave, supported } from 'browser-fs-access';
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
    ].join('\n'),
  );
};
window.onunhandledrejection = (event) => window.onerror(event.reason);

export const receive = (channel: string, args: unknown[]) => {
  platformDelegate.receive(channel, args);
};

const getFileSystem: () => BufferFileSystem = () =>
  proxy({
    areHandlesSupported: async () => supported,
    saveFile: async (buffer, defaultFileName: string, handle) => {
      const { result, cancelled } = await runIgnoringAbortErrors(logger, () =>
        fileSave(
          new Blob([buffer]),
          {
            fileName: defaultFileName,
          },
          handle,
        ),
      );
      if (cancelled) {
        return { cancelled: true };
      }
      return { handle: result, cancelled: false };
    },
    openFile: async () => {
      const { result } = await runIgnoringAbortErrors(logger, () =>
        fileOpen({ extensions: SUPPORTED_EXTENSIONS }),
      );
      if (result) {
        const data = await result.arrayBuffer();
        return {
          path: result.name,
          data: transfer(data, [data]),
          handle: result.handle,
        };
      }
    },
  });

const getLocalStorage: () => Storage = () => proxy(localStorage);
const getSessionStorage: () => Storage = () => proxy(sessionStorage);
const showConfirmDialog = (message?: string) => confirm(message);
const onError = (reason: unknown) => {
  // @ts-expect-error reason is PROBABLY an error or an event but the error handlers are flexible enough that it
  // doesn't matter.
  window.onerror(reason, null, null, null, reason);
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
  mainProcessWorker,
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
};
