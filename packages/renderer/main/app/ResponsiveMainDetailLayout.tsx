import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { Box, Paper } from '@mui/material';
import React, { ReactNode, useEffect } from 'react';

interface ResponsiveMenuDetailLayoutProps {
  /** The main component that should be displayed. */
  main: ReactNode;
  /** The detail, secondary, component that should be displayed. */
  detail: ReactNode;
  /** The menu component that should be displayed. */
  menu: ReactNode;
}

const DetailPaper = ({ children }: { children: ReactNode }) => (
  <Paper
    elevation={1}
    sx={{ padding: '8px', margin: '16px', maxHeight: '100%' }}
  >
    {children}
  </Paper>
);

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
  let displayableChildren: ReactNode[];
  if (isSmallLayout) {
    displayableChildren = [
      <React.Fragment key={'menu'}>{menu}</React.Fragment>,
      <React.Fragment key={'main'}>{main}</React.Fragment>,
      <DetailPaper key={'detail'}>{detail}</DetailPaper>,
    ];
  } else {
    displayableChildren = [
      <React.Fragment key={'menu'}>{menu}</React.Fragment>,
      <React.Fragment key={'main'}>{main}</React.Fragment>,
      <DetailPaper key={'detail'}>{detail}</DetailPaper>,
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
    return `auto minmax(200px, 1fr) minmax(auto, 35%)`;
  } else {
    return `100%`;
  }
};

const createGridTemplateColumns = (isSmallLayout: boolean) => {
  if (isSmallLayout) {
    return `100%`;
  } else {
    return `auto minmax(200px, 1fr) 25%`;
  }
};
