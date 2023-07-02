import {
  PlatformDelegate,
  RendererDelegate,
} from '@lyricistant/common/Delegates';
import {
  BrowserWindow,
  IpcMain,
  ipcMain as electronMain,
  IpcRenderer,
  ipcRenderer as electronRenderer,
  Event,
} from 'electron';
import log from 'electron-log';

const logger = log;
const newRendererListenerListeners = new Map<string, Array<() => void>>();

interface WrappedListener extends ElectronListener {
  originalListener?: (...args: any[]) => void;
}

type ElectronListener = (event: Event, ...args: []) => Promise<void> | void;

class WrappedListenerHelper {
  private listeners = new Set<WrappedListener>();

  public wrap = (listener: (...args: any[]) => unknown): ElectronListener => {
    const wrappedListener: WrappedListener = (_: Event, ...args: any[]) => {
      Promise.resolve(listener(...args)).catch((reason) => {
        logger.error('Uncaught exception in listener', reason);
        throw reason;
      });
    };

    wrappedListener.originalListener = listener;

    this.listeners.add(wrappedListener);

    return wrappedListener;
  };

  public remove = (
    listener: (...args: any[]) => void
  ): ElectronListener | null => {
    let wrappedListener = null;
    this.listeners.forEach((wrapped) => {
      if (wrapped.originalListener === listener) {
        wrappedListener = wrapped;
      }
    });

    if (!wrappedListener) {
      return null;
    }

    this.listeners.delete(wrappedListener);
    return wrappedListener;
  };
}

export class ElectronRendererDelegate implements RendererDelegate {
  private ipcMain: IpcMain;
  private window: BrowserWindow;

  private listeners = new WrappedListenerHelper();

  public constructor(ipcMain: IpcMain, window: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.window = window;

    this.ipcMain.on('new-listener-registered', (event, channel: string) => {
      newRendererListenerListeners.get(channel)?.forEach((value) => value());
      event.returnValue = null;
    });
  }

  public send(channel: string, ...args: any[]): void {
    logger.info('Sending data to renderer', channel, args);
    args.forEach((arg) => {
      if (isError(arg)) {
        logger.error(arg.message, arg);
      }
    });
    this.window.webContents.send(channel, ...args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    logger.info('Registering renderer listener', channel);

    this.ipcMain.on(channel, this.listeners.wrap(listener));

    return this;
  }

  public addRendererListenerSetListener(
    channel: string,
    listener: () => void
  ): void {
    const listeners = newRendererListenerListeners.get(channel) ?? [];
    listeners.push(listener);
    newRendererListenerListeners.set(channel, listeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing renderer listener', channel);

    const realListener = this.listeners.remove(listener);
    if (realListener) {
      this.ipcMain.removeListener(channel, realListener);
    }

    return this;
  }
}

class ElectronPlatformDelegate implements PlatformDelegate {
  private ipcRenderer: IpcRenderer;

  private listeners = new WrappedListenerHelper();

  public constructor(ipcRenderer: IpcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  public send(channel: string, ...args: any[]): void {
    logger.info('Sending data to platform', channel, args);
    args.forEach((arg) => {
      if (isError(arg)) {
        logger.error(arg.message, arg);
      }
    });
    this.ipcRenderer.send(channel, ...args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    logger.info('Registering platform listener', channel);

    this.ipcRenderer.on(channel, this.listeners.wrap(listener));
    this.ipcRenderer.sendSync('new-listener-registered', channel);

    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing platform listener', channel);

    const realListener = this.listeners.remove(listener);
    if (realListener) {
      this.ipcRenderer.removeListener(channel, realListener);
    }

    return this;
  }
}

const isError = (e: any) => e instanceof Error;

export const createRendererDelegate: (
  window: BrowserWindow
) => RendererDelegate = (window) =>
  new ElectronRendererDelegate(electronMain, window);
export const platformDelegate: PlatformDelegate = new ElectronPlatformDelegate(
  electronRenderer
);
