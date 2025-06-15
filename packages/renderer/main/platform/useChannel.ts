import {
  PlatformToRendererListener,
  RendererChannel,
} from '@lyricistant/common/Delegates';
import { DependencyList, useEffect, useState } from 'react';

/**
 * Register the provided listener on the given platform channel. The listener
 * will be invoked whenever the platform sends data to the given channel.
 *
 * @param channel Platform channel to listen to changes on.
 * @param listener Listener that will be invoked.
 * @param deps The dependencies that will be used to re-register the listener
 *   whenever they change. If not provided, listener will be re-registered
 *   whenever the React component is re-mounted. This differs from useEffect
 *   when no dependency list is provided, as useEffect would re-register on
 *   every render pass.
 */
export const useChannel: <Channel extends RendererChannel>(
  channel: Channel,
  listener: PlatformToRendererListener[Channel],
  deps?: DependencyList,
) => void = (channel, listener, deps) => {
  useEffect(() => {
    platformDelegate.on(channel, listener);
    return () => {
      platformDelegate.removeListener(channel, listener);
    };
  }, deps ?? []);
};

/**
 * Returns the most recent data that that has been sent via this channel to the
 * renderer while this hook was running.
 *
 * Note: This will return an empty array initially, so while destructuring it
 * will work, all values will be undefined until this channel emits something.
 *
 * @param channel Platform channel to listen to changes on.
 * @param shouldRegister When this is true, will attempt to register. If this is
 *   false, it won't register. Useful for when the change of a dependency should
 *   re-register a listener on the platform, but only in certain situations,
 *   like to only register when a dialog is open.
 */
export const useChannelData: <Channel extends RendererChannel>(
  channel: Channel,
  shouldRegister?: boolean,
) => Parameters<PlatformToRendererListener[Channel]> = (
  channel,
  shouldRegister,
) => {
  const [result, setResult] = useState([]);
  useEffect(() => {
    if (shouldRegister === false) {
      return;
    }
    const listener = (...args: unknown[]) => {
      setResult(args);
    };
    platformDelegate.on(channel, listener);
    return () => {
      platformDelegate.removeListener(channel, listener);
    };
  }, [shouldRegister]);
  // Disable no explicit any here since Typescript can't know that the types
  // work out here due to generics erasure.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result as any;
};
