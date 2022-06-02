import { useTheme, useMediaQuery } from '@mui/material';

/**
 * A React hook that returns a boolean saying whether Lyricistant is using
 * its small, mobile friendly layout or not.
 *
 * @return true if using small layout, false is not.
 */
export const useSmallLayout = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};
