import { jest } from '@jest/globals';
import {
  PlatformDelegate,
  PlatformToRendererListener,
  RendererChannel,
} from '@lyricistant/common/Delegates';
import { PlatformListeners } from '@testing/utilities/Listeners';
import { act } from '@testing-library/react';

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
  public removeListener = <Channel extends RendererChannel>(
    channel: Channel,
    listener: PlatformToRendererListener[Channel]
  ): this => {
    this.listeners.remove(channel, listener);
    return this;
  };

  public invoke = async <Channel extends RendererChannel>(
    key: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): Promise<void> => {
    await act(() => this.listeners.invoke(key, ...args));
  };
  public clear = () => this.listeners.clear();
}
