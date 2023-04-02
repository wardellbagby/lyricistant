import React, { ReactNode, useEffect, useRef } from 'react';

/**
 * Handles telling the platform when the renderer is ready to receive events.
 *
 * Due to how React's useEffect works, this MUST be the top-most component in
 * the tree that uses the platform delegate, so that the app properly alerts the
 * platform that it is ready to receive events after every other component has
 * registered its own platform listeners.
 */
export const PlatformEventsReadyHandler = ({
  children,
}: {
  children: ReactNode;
}) => {
  // useEffects can be called multiple times (and are in Strict mode) so this makes sure this
  // is really only ever called once.
  const hasSentReadyForEvents = useRef(false);
  useEffect(() => {
    if (!hasSentReadyForEvents.current) {
      platformDelegate.send('ready-for-events', {
        isDeepLink: location.hash.length !== 0,
      });
    }

    hasSentReadyForEvents.current = true;
  }, []);
  return <>{children}</>;
};
