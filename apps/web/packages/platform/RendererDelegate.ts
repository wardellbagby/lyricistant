import {
  PlatformChannel,
  PlatformToRendererListener,
  RendererChannel,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';
import { ListenerManager } from '@lyricistant/core-platform/Delegates';
import { renderer } from './renderer';

export class WebRendererDelegate implements RendererDelegate {
  private listeners: ListenerManager = new ListenerManager();
  private rendererListenerSetListeners = new Map<string, Array<() => void>>();

  public receive = (channel: string, args: any[]) => {
    this.listeners
      .getListeners(channel)
      .forEach((listener) => listener(...args));
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
