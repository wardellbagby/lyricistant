import {
  PlatformChannel,
  RendererChannel,
  RendererDelegate,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';
import { RendererListeners } from '@testing/utilities/Listeners';
import { fake, stub } from 'sinon';

/** An implementation of a Renderer Delegate useful for tests. */
export class MockRendererDelegate implements RendererDelegate {
  public on: <Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ) => this = fake((channel: any, listener: any) => {
    this.listeners.set(channel, listener);
    return this;
  });
  public send: () => void = stub();
  public addRendererListenerSetListener: <Channel extends RendererChannel>(
    channel: Channel,
    onRendererListenerSet: () => void
  ) => this = fake((channel: any, listener: any) => {
    this.rendererListenerSetListeners.set(channel, listener);
    return this;
  });

  private listeners = new RendererListeners();
  private rendererListenerSetListeners = new Map<string, any>();

  /** Clears all listeners that have been set on this renderer delegate. */
  public clear = () => {
    this.listeners.clear();
    this.rendererListenerSetListeners.clear();
  };

  public removeListener<Channel extends PlatformChannel>(
    channel: Channel,
    listener: RendererToPlatformListener[Channel]
  ): this {
    this.listeners.remove(channel, listener);
    return this;
  }

  /**
   * Immediately invoke all listeners that have registered for `channel`
   *
   * @param channel The platform channel that has registered listeners.
   * @param args The arguments to give to the listeners.
   */
  public invoke = async <Channel extends PlatformChannel>(
    channel: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): Promise<void> => this.listeners.invoke(channel, ...args);

  /**
   * Invoke all listeners that have registered for `channel` when the platform
   * registers a listener using {@link on}
   *
   * @param channel The platform channel that has registered listeners.
   * @param args The arguments to give to the listeners.
   */
  public invokeOnSet = <Channel extends PlatformChannel>(
    channel: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ) => {
    this.listeners.invokeOnSet(channel, ...args);
  };

  /**
   * Immediately invoke all renderer listener set listeners that have registered
   * for `channel`
   *
   * @param channel The platform channel that has registered listeners.
   * @see addRendererListenerSetListener
   */
  public invokeRendererListenerSetListener = async <
    Channel extends RendererChannel
  >(
    channel: Channel
  ): Promise<void> => {
    const listener = this.rendererListenerSetListeners.get(channel);
    if (!listener) {
      throw new Error(`No renderer listener set for channel ${channel}`);
    } else {
      await listener();
    }
  };
}
