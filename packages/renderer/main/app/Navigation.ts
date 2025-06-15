import { useCallback } from 'react';
import { useLocation } from 'wouter';

/** The paths that Lyricistant can navigate to. */
export type RoutePaths =
  | '/'
  | '/about'
  | '/download'
  | '/file-history'
  | '/preferences'
  | '/privacypolicy';

export const useNavigation = () => {
  const setLocation = useLocation()[1];
  return (path: RoutePaths, options?: { replace?: boolean }) => {
    setLocation(path.replace('/', ''), options);
  };
};

export const useBackNavigation = () => {
  const navigate = useNavigation();
  return useCallback(() => {
    const state: Record<string, never> = window.history.state;
    if (state?.['internal'] === true) {
      window.history.back();
    } else {
      navigate('/', { replace: true });
    }
  }, []);
};
