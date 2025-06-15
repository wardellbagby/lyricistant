import {
  PlatformDelegate,
  RendererDelegate,
} from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { DOMLogger } from '@lyricistant/core-dom-platform/platform/DOMLogger';

const logger: Logger = new DOMLogger();

class DOMPlatformDelegate implements PlatformDelegate {
  public send(channel: string, ...args: unknown[]) {
    logger.info('Sending data to platform', { channel, args });
    queue(rendererListeners.getListeners(channel), args);
  }

  public on(channel: string, listener: (...args: unknown[]) => void): this {
    logger.info('Registering renderer listener', { channel });
    platformListeners.addListener(channel, listener);
    newRendererListenerListeners.get(channel)?.forEach((value) => value());
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: unknown[]) => void,
  ): this {
    logger.info('Removing renderer listener', { channel });
    platformListeners.removeListener(channel, listener);
    return this;
  }
}

export class DOMRendererDelegate implements RendererDelegate {
  public send(channel: string, ...args: unknown[]) {
    logger.info('Sending data to renderer', { channel, args });
    queue(platformListeners.getListeners(channel), args);
  }

  public on(channel: string, listener: (...args: unknown[]) => void): this {
    logger.info('Registering platform listener', { channel });
    rendererListeners.addListener(channel, listener);
    return this;
  }

  public addRendererListenerSetListener(
    channel: string,
    listener: () => void,
  ): void {
    const listeners = newRendererListenerListeners.get(channel) ?? [];
    listeners.push(listener);
    newRendererListenerListeners.set(channel, listeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: unknown[]) => void,
  ): this {
    logger.info('Removing platform listener', { channel });
    rendererListeners.removeListener(channel, listener);
    return this;
  }
}

export class ListenerManager {
  private listeners: Map<string, Array<(...args: unknown[]) => void>> =
    new Map();

  public addListener(
    channel: string,
    listener: (...args: unknown[]) => void,
  ): void {
    const registeredListeners = this.getListeners(channel);
    registeredListeners.push(listener);

    this.listeners.set(channel, registeredListeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: unknown[]) => void,
  ): void {
    const registeredListeners = this.getListeners(channel);
    registeredListeners.splice(registeredListeners.indexOf(listener), 1);

    this.listeners.set(channel, registeredListeners);
  }

  public getListeners(channel: string): Array<(...args: unknown[]) => unknown> {
    return [...(this.listeners.get(channel) ?? [])];
  }
}

const queue = (
  functions: Array<(..._: unknown[]) => void>,
  args: unknown[],
) => {
  args.forEach((arg) => {
    if (isError(arg)) {
      logger.error(arg.message, arg);
    }
  });

  functions.forEach((listener) => listener(...args));
};

const isError = (e: unknown) => e instanceof Error;

const platformListeners: ListenerManager = new ListenerManager();
const rendererListeners: ListenerManager = new ListenerManager();
const newRendererListenerListeners = new Map<string, Array<() => void>>();

export const platformDelegate: PlatformDelegate = new DOMPlatformDelegate();
