import { PlatformChannel, RendererToPlatformListener } from '@common/Delegates';

type Listener = (...args: any[]) => any;

export class RendererListeners {
  private listeners: Map<PlatformChannel, Listener> = new Map();
  public clear = () => this.listeners.clear();

  public invoke = async <Channel extends PlatformChannel>(
    key: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): Promise<ReturnType<RendererToPlatformListener[Channel]>> =>
    this.listeners.get(key)(...args);

  public set = <Channel extends PlatformChannel>(
    key: Channel,
    value: RendererToPlatformListener[Channel]
  ) => this.listeners.set(key, value);
}

export class EventListeners {
  private listeners: Map<string, Listener> = new Map();
  public clear = () => this.listeners.clear();

  public invoke = async (key: string, ...args: any[]): Promise<any> =>
    this.listeners.get(key)(...args);

  public set = (key: string, value: Listener) => this.listeners.set(key, value);
}
