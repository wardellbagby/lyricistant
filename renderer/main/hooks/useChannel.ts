import { PlatformToRendererListener, RendererChannel } from '@common/Delegates';
import { platformDelegate } from '../globals';

import { DependencyList, useEffect } from 'react';

/**
 * Register the provided listener on the given platform channel. The listener
 * will be invoked whenever the platform sends data to the given channel.
 *
 * @param channel Platform channel to listen to changes on.
 * @param listener Listener that will be invoked.
 * @param deps The dependencies that will be used to re-register the listener
 * whenever they change. If not provided, listener will be re-registered
 * whenever the React component is re-mounted. This differs from useEffect when
 * no dependency list is provided, as useEffect would re-register on every
 * render pass.
 */
export const useChannel: <Channel extends RendererChannel>(
  channel: Channel,
  listener: PlatformToRendererListener[Channel],
  deps?: DependencyList
) => void = (channel, listener, deps) => {
  useEffect(() => {
    platformDelegate.on(channel, listener);
    return () => platformDelegate.removeListener(channel, listener);
  }, deps ?? []);
};
