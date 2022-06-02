import { useTheme, useMediaQuery } from '@mui/material';

/**
 * A React hook that returns a boolean saying whether Lyricistant is using its
 * small, mobile friendly layout or not.
 *
 * @returns True if using small layout, false if not.
 */
export const useSmallLayout = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};
