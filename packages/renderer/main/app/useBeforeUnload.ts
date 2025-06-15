import { useEffect } from 'react';

export const useBeforeUnload = (listener: () => void) => {
  useEffect(() => {
    window.addEventListener('beforeunload', listener);
    return () => {
      window.removeEventListener('beforeunload', listener);
    };
  }, [listener]);
};
