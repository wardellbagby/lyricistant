import { Box } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import React, { FunctionComponent } from 'react';

export const AppLayout: FunctionComponent = ({ children }) => {
  const theme = useTheme();
  const useSmallLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const childArray = React.Children.toArray(children);
  let displayableChildren;
  if (useSmallLayout) {
    displayableChildren = [childArray[0], <div />, ...childArray.slice(1)];
  } else {
    displayableChildren = children;
  }
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
    return `56px 8px minmax(200px, 1fr) 15%`;
  } else {
    return `100%`;
  }
};

const createGridTemplateColumns = (useSmallLayout: boolean) => {
  if (useSmallLayout) {
    return `100%`;
  } else {
    return `56px minmax(200px, 1fr) minmax(25%, 30%)`;
  }
};
