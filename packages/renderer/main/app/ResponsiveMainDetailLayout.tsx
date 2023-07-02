import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { Box } from '@mui/material';
import React, { ReactNode, useEffect } from 'react';

interface ResponsiveMenuDetailLayoutProps {
  /** The main component that should be displayed. */
  main: ReactNode;
  /** The detail, secondary, component that should be displayed. */
  detail: ReactNode;
  /** The menu component that should be displayed. */
  menu: ReactNode;
}

/**
 * A responsive layout with a main, detail, and menu section that changes based
 * on the screen size.
 *
 * @param props The props for this component.
 */
export const ResponsiveMainDetailLayout = ({
  main,
  detail,
  menu,
}: ResponsiveMenuDetailLayoutProps) => {
  const isSmallLayout = useSmallLayout();

  useEffect(() => {
    logger.info(`Switching layout. isSmallLayout: ${isSmallLayout}`);
  }, [isSmallLayout]);

  return (
    <Box
      flex={'1 1 auto'}
      display={'flex'}
      overflow={'hidden'}
      flexDirection={isSmallLayout ? 'column' : 'row'}
    >
      <React.Fragment key={'menu'}>{menu}</React.Fragment>
      <React.Fragment key={'main'}>{main}</React.Fragment>
      <React.Fragment key={'detail'}>{detail}</React.Fragment>
    </Box>
  );
};
