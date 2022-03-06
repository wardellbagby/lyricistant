import {
  PlatformChannel,
  PlatformToRendererListener,
  RendererChannel,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';
import { ListenerManager } from '@lyricistant/core-dom-platform/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { renderer } from './renderer';

export class WebRendererDelegate implements RendererDelegate {
  private listeners: ListenerManager = new ListenerManager();
  private rendererListenerSetListeners = new Map<string, Array<() => void>>();

  public constructor(private logger: Logger) {}

  public receive = (channel: string, args: any[]) => {
    this.listeners.getListeners(channel).forEach((listener) => {
      Promise.resolve(listener(...args)).catch((reason) => {
        this.logger.error('Uncaught exception in listener', reason);
        throw reason;
      });
    });
  };

  public on<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this {
    this.listeners.addListener(channel, listener);
    return this;
  }

  public removeListener<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this {
    this.listeners.removeListener(channel, listener);
    return this;
  }

  public send<Channel extends RendererChannel>(
    channel: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): void {
    this.logger.info('Sending data to renderer', { channel, args });
    renderer.receive(channel, args);
  }

  public onRendererListenerSet = (channel: string) => {
    const listeners = this.rendererListenerSetListeners.get(channel) ?? [];
    listeners.forEach((listener) => listener());
  };

  public addRendererListenerSetListener = <Channel extends RendererChannel>(
    channel: Channel,
    listener: () => void
  ) => {
    const listeners = this.rendererListenerSetListeners.get(channel) ?? [];
    listeners.push(listener);
    this.rendererListenerSetListeners.set(channel, listeners);
  };
}
