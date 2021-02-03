import {
  PlatformDelegate,
  PlatformToRendererListener,
  RendererChannel,
} from '@common/Delegates';
import { PlatformListeners } from '@testing/utilities/Listeners';

export class MockPlatformDelegate implements PlatformDelegate {
  public send: () => void = jest.fn();
  private listeners = new PlatformListeners();
  public on = <Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this => {
    this.listeners.set(channel, listener);
    return this;
  };
  public removeListener = (): this => this;
  public invoke = async <Channel extends RendererChannel>(
    key: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): Promise<void> => this.listeners.invoke(key, ...args);
  public clear = () => this.listeners.clear();
}
