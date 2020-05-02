// tslint:disable: unified-signatures
import { PlatformDelegate, RendererDelegate } from 'common/Delegates';
import { onRendererStarted } from '.';

class WebPlatformDelegate implements PlatformDelegate {
  public send(channel: string, ...args: any[]) {
    rendererListeners
      .getListeners(channel)
      .forEach(async (listener) => listener(...args));
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    platformListeners.addListener(channel, listener);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    platformListeners.removeListener(channel, listener);
    return this;
  }
}

class WebRendererDelegate implements RendererDelegate {
  public send(channel: string, ...args: any[]) {
    platformListeners
      .getListeners(channel)
      .forEach(async (listener) => listener(...args));
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    rendererListeners.addListener(channel, listener);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    rendererListeners.removeListener(channel, listener);
    return this;
  }
}

class ListenerManager {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  public addListener(
    channel: string,
    listener: (...args: any[]) => void
  ): void {
    const registeredListeners: Array<(
      ...args: any[]
    ) => void> = this.getListeners(channel);
    registeredListeners.push(listener);

    this.listeners.set(channel, registeredListeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): void {
    const registeredListeners: Array<(
      ...args: any[]
    ) => void> = this.getListeners(channel);
    registeredListeners.splice(registeredListeners.indexOf(listener));

    this.listeners.set(channel, registeredListeners);
  }

  public getListeners(channel: string): Array<(...args: any[]) => void> {
    return [...(this.listeners.get(channel) ?? [])];
  }
}

const platformListeners: ListenerManager = new ListenerManager();
const rendererListeners: ListenerManager = new ListenerManager();

export const platformDelegate: PlatformDelegate = new WebPlatformDelegate();
export const rendererDelegate: RendererDelegate = new WebRendererDelegate();

onRendererStarted();
