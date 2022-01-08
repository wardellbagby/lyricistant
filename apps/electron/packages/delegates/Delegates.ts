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
} from 'electron';
import log from 'electron-log';

const logger = log;
const newRendererListenerListeners = new Map<string, Array<() => void>>();

interface WrappedListener {
  (...args: any[]): void;
  originalListener?: (...args: any[]) => void;
}

export class ElectronRendererDelegate implements RendererDelegate {
  private ipcMain: IpcMain;
  private window: BrowserWindow;

  private listeners = new Set<WrappedListener>();

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
    const listenerWithEvent: WrappedListener = (
      _: GlobalEvent,
      ...args: any[]
    ) => {
      listener(...args);
    };

    listenerWithEvent.originalListener = listener;

    this.listeners.add(listenerWithEvent);

    this.ipcMain.on(channel, listenerWithEvent);
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
    let wrappedListener: typeof listener;

    this.listeners.forEach((wrapped) => {
      if (wrapped.originalListener === listener) {
        wrappedListener = wrapped;
      }
    });

    if (!wrappedListener) {
      throw new Error("Can't remove listener that was never registered!");
    }

    this.listeners.delete(wrappedListener);
    this.ipcMain.removeListener(channel, wrappedListener);
    return this;
  }
}

class ElectronPlatformDelegate implements PlatformDelegate {
  private ipcRenderer: IpcRenderer;

  private listeners = new Map<
    string,
    (event: GlobalEvent, ...args: any[]) => void
  >();

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
    const listenerWithEvent = (_: GlobalEvent, ...args: any[]) => {
      listener(...args);
    };

    this.listeners.set(listener.toString(), listenerWithEvent);

    this.ipcRenderer.on(channel, listenerWithEvent);
    this.ipcRenderer.sendSync('new-listener-registered', channel);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing platform listener', channel);
    this.ipcRenderer.removeListener(
      channel,
      this.listeners.get(listener.toString())
    );
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
