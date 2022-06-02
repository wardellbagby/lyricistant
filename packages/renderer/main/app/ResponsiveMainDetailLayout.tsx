import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { ReactNode, useEffect } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  divider: {
    background: theme.palette.background.paper,
  },
}));

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
  const classes = useStyles();
  const isSmallLayout = useSmallLayout();
  let displayableChildren: ReactNode[];
  if (isSmallLayout) {
    displayableChildren = [
      <React.Fragment key={'menu'}>{menu}</React.Fragment>,
      <React.Fragment key={'main'}>{main}</React.Fragment>,
      <div key={'main-detail-divider'} className={classes.divider} />,
      <React.Fragment key={'detail'}>{detail}</React.Fragment>,
    ];
  } else {
    displayableChildren = [
      <React.Fragment key={'menu'}>{menu}</React.Fragment>,
      <React.Fragment key={'main'}>{main}</React.Fragment>,
      <React.Fragment key={'detail'}>{detail}</React.Fragment>,
    ];
  }

  useEffect(
    () => logger.info(`Switching layout. isSmallLayout: ${isSmallLayout}`),
    [isSmallLayout]
  );
  return (
    <Box
      height={'100%'}
      width={'100%'}
      display={'grid'}
      m={0}
      p={0}
      overflow={'hidden'}
      gridTemplateRows={createGridTemplateRows(isSmallLayout)}
      gridTemplateColumns={createGridTemplateColumns(isSmallLayout)}
    >
      {displayableChildren}
    </Box>
  );
};

const createGridTemplateRows = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return `auto minmax(200px, 1fr) 4px auto`;
  } else {
    return `100%`;
  }
};

const createGridTemplateColumns = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return `100%`;
  } else {
    return `auto minmax(200px, 1fr) minmax(25%, auto)`;
  }
};
