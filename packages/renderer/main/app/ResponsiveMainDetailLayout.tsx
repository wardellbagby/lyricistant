import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { PropsWithChildren, ReactNode, useEffect, useMemo } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  divider: {
    background: theme.palette.background.paper,
  },
}));

interface ResponsiveMenuDetailLayout {
  main: ReactNode;
  detail: ReactNode;
  menu: ReactNode;
  footer: ReactNode;
}

const Wrapper = ({
  name,
  children,
}: PropsWithChildren<{ name: keyof ResponsiveMenuDetailLayout }>) => (
  <Box display={'flex'} gridArea={name} key={name}>
    {children}
  </Box>
);

export const ResponsiveMainDetailLayout = ({
  main,
  detail,
  menu,
  footer,
}: ResponsiveMenuDetailLayout) => {
  const classes = useStyles();
  const isSmallLayout = useSmallLayout();
  const displayableChildren: ReactNode[] = useMemo(() => {
    if (isSmallLayout) {
      return [
        <React.Fragment key={'menu'}>{menu}</React.Fragment>,
        <React.Fragment key={'main'}>{main}</React.Fragment>,
        <div key={'main-detail-divider'} className={classes.divider} />,
        <React.Fragment key={'detail'}>{detail}</React.Fragment>,
      ];
    } else {
      return [
        <Wrapper name={'menu'}>{menu}</Wrapper>,
        <Wrapper name={'main'}>{main}</Wrapper>,
        <Wrapper name={'detail'}>{detail}</Wrapper>,
        <Wrapper name={'footer'}>{footer}</Wrapper>,
      ];
    }
  }, [isSmallLayout]);

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
      gridTemplateAreas={createGridTemplateAreas(isSmallLayout)}
      gridTemplateRows={createGridTemplateRows(isSmallLayout)}
      gridTemplateColumns={createGridTemplateColumns(isSmallLayout)}
    >
      {displayableChildren}
    </Box>
  );
};

const createGridTemplateAreas = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return 'menu main detail';
  }
  return '"menu main detail" "menu footer footer"';
};
const createGridTemplateRows = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return `auto minmax(200px, 1fr) 4px auto`;
  } else {
    return `1fr auto`;
  }
};

const createGridTemplateColumns = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return `100%`;
  } else {
    return `auto minmax(200px, 1fr) minmax(25%, auto)`;
  }
};
