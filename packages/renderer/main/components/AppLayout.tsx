import { Box, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import React, { ReactNode, useEffect } from 'react';
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
  const theme = useTheme();
  const classes = useStyles();
  const useSmallLayout = useMediaQuery(theme.breakpoints.down('sm'));
  let displayableChildren: ReactNode[];
  if (useSmallLayout) {
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
    () => logger.info(`Switching layout. isSmallLayout: ${useSmallLayout}`),
    [useSmallLayout]
  );
  return (
    <Box
      height={'100%'}
      width={'100%'}
      display={'grid'}
      m={0}
      p={0}
      overflow={'hidden'}
      gridTemplateRows={createGridTemplateRows(useSmallLayout)}
      gridTemplateColumns={createGridTemplateColumns(useSmallLayout)}
    >
      {displayableChildren}
    </Box>
  );
};

const createGridTemplateRows = (useSmallLayout: boolean) => {
  if (useSmallLayout) {
    return `auto 8px minmax(200px, 1fr) 4px 15%`;
  } else {
    return `100%`;
  }
};

const createGridTemplateColumns = (useSmallLayout: boolean) => {
  if (useSmallLayout) {
    return `100%`;
  } else {
    return `56px minmax(200px, 1fr) minmax(25%, auto)`;
  }
};
