import {
  PlatformChannel,
  PlatformDelegate,
  PlatformToRendererListener,
  RendererChannel,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';
import { ListenerManager } from '@lyricistant/core-platform/Delegates';
import { platform } from './platform';

class WebPlatformDelegate implements PlatformDelegate {
  private listeners: ListenerManager = new ListenerManager();

  public receive = (channel: string, args: any[]) => {
    this.listeners
      .getListeners(channel)
      .forEach((listener) => listener(...args));
  };

  public on<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this {
    this.listeners.addListener(channel, listener);
    platform.onRendererListenerSet(channel);
    return this;
  }

  public removeListener<Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this {
    this.listeners.removeListener(channel, listener);
    return this;
  }

  public send<Channel extends PlatformChannel>(
    channel: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): void {
    logger.info('Sending data to platform', { channel, args });
    platform.receive(channel, args);
  }
}

export const platformDelegate = new WebPlatformDelegate();
