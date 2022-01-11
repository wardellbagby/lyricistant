import { useTheme, useMediaQuery } from '@mui/material';

export const useSmallLayout = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};
