import { useTheme, useMediaQuery } from '@material-ui/core';

export const useSmallLayout = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};
