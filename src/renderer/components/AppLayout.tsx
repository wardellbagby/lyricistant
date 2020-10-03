import { Box, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import React, { FunctionComponent, ReactNode, useEffect } from 'react';
import { appComponent } from '../globals';

const useStyles = makeStyles((theme: Theme) => ({
  divider: {
    background: theme.palette.background.paper,
  },
}));

export const AppLayout: FunctionComponent = ({ children }) => {
  const theme = useTheme();
  const classes = useStyles();
  const useSmallLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const childArray = React.Children.toArray(children);
  let displayableChildren: ReactNode[];
  if (useSmallLayout) {
    displayableChildren = [
      childArray[0],
      <div />,
      ...childArray.slice(1, 2),
      <div className={classes.divider} />,
      childArray[childArray.length - 1],
    ];
  } else {
    displayableChildren = childArray;
  }

  useEffect(
    () =>
      appComponent
        .get<Logger>()
        .info(`Switching layout. isSmallLayout: ${useSmallLayout}`),
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
      {displayableChildren.map((child, index) => (
        <React.Fragment key={index}>{child}</React.Fragment>
      ))}
    </Box>
  );
};

const createGridTemplateRows = (useSmallLayout: boolean) => {
  if (useSmallLayout) {
    return `56px 8px minmax(200px, 1fr) 4px 15%`;
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
