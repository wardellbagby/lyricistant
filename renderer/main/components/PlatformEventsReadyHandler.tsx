import React, { PropsWithChildren, useEffect } from 'react';
import { platformDelegate } from '../globals';

/**
 * Handles telling the platform when the renderer is ready to receive events.
 *
 * Due to how React's useEffect works, this MUST be the top-most component in
 * the tree so that the app properly alerts the platform that it is ready to
 * receive events after every other other component has registered its own
 * platform listeners.
 */
export const PlatformEventsReadyHandler = ({
  children,
}: PropsWithChildren<{}>) => {
  useEffect(() => platformDelegate.send('ready-for-events'), []);
  return <>{children}</>;
};
