import {
  PlatformChannel,
  PlatformToRendererListener,
  RendererChannel,
  RendererToPlatformListener,
} from '@lyricistant/common/Delegates';

type Listener = (...args: any[]) => any;

const add = (key: string, value: any, map: Map<string, any[]>) => {
  const currentValues = map.get(key) ?? [];
  map.set(key, [...currentValues, value]);
};
const remove = (key: string, value: any, map: Map<string, any[]>) => {
  const currentValues = map.get(key) ?? [];
  currentValues.splice(currentValues.indexOf(value), 1);
  map.set(key, currentValues);
};
const invokeAll = async (
  key: string,
  args: any[],
  map: Map<string, Listener[]>
) => {
  if (!map.has(key)) {
    throw new Error(`Listener for event type ${key} was never registered!`);
  }

  for (const value of map.get(key)) {
    await value(...args);
  }
  return;
};

export class RendererListeners {
  private listeners: Map<PlatformChannel, Listener[]> = new Map();
  private delayedInvokes: Map<PlatformChannel, any[][]> = new Map();
  public clear = () => {
    this.listeners.clear();
    this.delayedInvokes.clear();
  };

  public invoke = async <Channel extends PlatformChannel>(
    key: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ): Promise<void> => {
    if (!this.listeners.has(key)) {
      throw new Error(`Listener for channel ${key} was never registered!`);
    }
    return invokeAll(key, args, this.listeners);
  };

  public invokeOnSet = <Channel extends PlatformChannel>(
    key: Channel,
    ...args: Parameters<RendererToPlatformListener[Channel]>
  ) => {
    add(key, args, this.delayedInvokes);
  };

  public set = <Channel extends PlatformChannel>(
    key: Channel,
    value: RendererToPlatformListener[Channel]
  ) => {
    add(key, value, this.listeners);
    if (this.delayedInvokes.has(key)) {
      for (const args of this.delayedInvokes.get(key)) {
        this.invoke(key, ...(args as any));
      }
      jest.runAllTimers();
      this.delayedInvokes.delete(key);
    }
  };

  public remove = <Channel extends PlatformChannel>(
    key: Channel,
    value: RendererToPlatformListener[Channel]
  ) => {
    remove(key, value, this.listeners);
  };
}

export class PlatformListeners {
  private listeners: Map<RendererChannel, Listener[]> = new Map();
  public clear = () => this.listeners.clear();

  public invoke = async <Channel extends RendererChannel>(
    key: Channel,
    ...args: Parameters<PlatformToRendererListener[Channel]>
  ): Promise<void> => invokeAll(key, args, this.listeners);

  public set = <Channel extends RendererChannel>(
    key: Channel,
    value: PlatformToRendererListener[Channel]
  ) => add(key, value, this.listeners);

  public remove = <Channel extends RendererChannel>(
    key: Channel,
    value: PlatformToRendererListener[Channel]
  ) => {
    remove(key, value, this.listeners);
  };
}

export class EventListeners {
  private listeners: Map<string, Listener[]> = new Map();
  public clear = () => this.listeners.clear();

  public invoke = async (key: string, ...args: any[]): Promise<void> =>
    invokeAll(key, args, this.listeners);

  public set = (key: string, value: Listener) =>
    add(key, value, this.listeners);
}
