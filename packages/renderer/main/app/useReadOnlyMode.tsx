import React, { useContext } from 'react';

export const ReadOnlyModeContext = React.createContext(false);

/**
 * Retrieve the current status of "readonly mode". When this is true, the user
 * shouldn't be allowed to take any actions that would result in their lyrics
 * being edited in any way.
 */
export const useReadOnlyMode = (): boolean => useContext(ReadOnlyModeContext);
