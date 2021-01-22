import { PlatformDelegate, RendererDelegate } from '@common/Delegates';
import { Logger } from '@common/Logger';
import {
  BrowserWindow,
  IpcMain,
  ipcMain as electronMain,
  IpcRenderer,
  ipcRenderer as electronRenderer,
} from 'electron';
import { ElectronLogger } from './platform/Logger';

const logger: Logger = new ElectronLogger();

export class ElectronRendererDelegate implements RendererDelegate {
  private ipcMain: IpcMain;
  private window: BrowserWindow;

  private listeners = new Map<
    string,
    (event: GlobalEvent, ...args: any[]) => void
  >();

  public constructor(ipcMain: IpcMain, window: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.window = window;
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
    const listenerWithEvent = (_: GlobalEvent, ...args: any[]) => {
      listener(...args);
    };

    this.listeners.set(listener.toString(), listenerWithEvent);

    this.ipcMain.on(channel, listenerWithEvent);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing renderer listener', channel);
    this.ipcMain.removeListener(
      channel,
      this.listeners.get(listener.toString())
    );
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
) => RendererDelegate = (window) => new ElectronRendererDelegate(electronMain, window);
export const platformDelegate: PlatformDelegate = new ElectronPlatformDelegate(
  electronRenderer
);
