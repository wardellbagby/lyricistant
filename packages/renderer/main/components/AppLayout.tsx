import { Box, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { ReactNode, useEffect } from 'react';
import { useSmallLayout } from '@lyricistant/renderer/hooks/useSmallLayout';
import { logger } from '../globals';

const useStyles = makeStyles((theme: Theme) => ({
  divider: {
    background: theme.palette.background.paper,
  },
}));

interface AppLayoutProps {
  main: ReactNode;
  detail: ReactNode;
  menu: ReactNode;
}

export const AppLayout = ({ main, detail, menu }: AppLayoutProps) => {
  const classes = useStyles();
  const isSmallLayout = useSmallLayout();
  let displayableChildren: ReactNode[];
  if (isSmallLayout) {
    displayableChildren = [
      <React.Fragment key={'menu'}>{menu}</React.Fragment>,
      <div key={'menu-main-divider'} />,
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
    return `auto 8px minmax(200px, 1fr) 4px 15%`;
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
