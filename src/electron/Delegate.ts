import { PlatformDelegate, RendererDelegate } from 'common/Delegate';
import {
  BrowserWindow,
  IpcMain,
  ipcMain as electronMain,
  IpcRenderer,
  ipcRenderer as electronRenderer
} from 'electron';

class ElectronRendererDelegate implements RendererDelegate {
  private ipcMain: IpcMain;
  private window: BrowserWindow;

  private listeners = new Map<
    string,
    (event: GlobalEvent, ...args: any[]) => void
  >();

  constructor(ipcMain: IpcMain, window: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.window = window;
  }
  public send(channel: string, ...args: any[]): void {
    this.window.webContents.send(channel, ...args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    const listenerWithEvent = (_: GlobalEvent, ...args: any[]) => {
      listener(...args);
    };

    this.listeners.set(listener.toString(), listenerWithEvent);

    this.ipcMain.on(channel, listenerWithEvent);
    return this;
  }
}

class ElectronPlatformDelegate implements RendererDelegate {
  private ipcRenderer: IpcRenderer;

  private listeners = new Map<
    string,
    (event: GlobalEvent, ...args: any[]) => void
  >();

  constructor(ipcRenderer: IpcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }
  public send(channel: string, ...args: any[]): void {
    this.ipcRenderer.send(channel, ...args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
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
    this.ipcRenderer.removeListener(
      channel,
      this.listeners.get(listener.toString())
    );
    return this;
  }
}

export const createRendererDelegate: (
  window: BrowserWindow
) => RendererDelegate = (window) => {
  return new ElectronRendererDelegate(electronMain, window);
};
export const platformDelegate: PlatformDelegate = new ElectronPlatformDelegate(
  electronRenderer
);
