import { Box, ButtonBase, Grid, Paper, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { AddCircle, FolderOpen, Save } from '@material-ui/icons';
import React, { FunctionComponent, PropsWithChildren } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 56,
    height: 56,
    color: theme.palette.action.active,
    flexShrink: 0,
    display: 'inline-flex'
  },
  icon: {
    width: 24,
    height: 24
  }
}));

const MenuIcon: FunctionComponent = ({ children }) => {
  const classes = useStyles();

  return (
    <ButtonBase className={classes.root}>
      <Box display="flex" alignItems="center" justifyContent="center">
        {React.Children.map(children, (child: React.ReactElement) =>
          React.cloneElement(child, { className: classes.icon })
        )}
      </Box>
    </ButtonBase>
  );
};
export const Menu: FunctionComponent<PropsWithChildren<{
  className?: string;
}>> = ({ className }) => {
  const theme = useTheme();
  const useHorizontal = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Paper className={className}>
      <Grid
        direction={useHorizontal ? 'row' : 'column'}
        alignItems={'center'}
        wrap={'wrap'}
      >
        <MenuIcon>
          <AddCircle />
        </MenuIcon>
        <MenuIcon>
          <FolderOpen />
        </MenuIcon>
        <MenuIcon>
          <Save />
        </MenuIcon>
      </Grid>
    </Paper>
  );
};
