import { Box, ButtonBase, Grid, Paper, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { AddCircle, FolderOpen, Save } from '@material-ui/icons';
import React, { FunctionComponent } from 'react';

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

const MenuIcon: FunctionComponent<{ onClick?: () => void }> = ({
  onClick,
  children
}) => {
  const classes = useStyles();

  return (
    <ButtonBase className={classes.root} onClick={onClick}>
      <Box display="flex" alignItems="center" justifyContent="center">
        {React.Children.map(children, (child: React.ReactElement) =>
          React.cloneElement(child, { className: classes.icon })
        )}
      </Box>
    </ButtonBase>
  );
};

interface MenuProps {
  className?: string;
  onNewClicked?: () => void;
  onOpenClicked: () => void;
  onSaveClicked: () => void;
}

export const Menu: FunctionComponent<MenuProps> = ({
  onNewClicked,
  onOpenClicked,
  onSaveClicked,
  className
}) => {
  const theme = useTheme();
  const useHorizontal = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Paper className={className}>
      <Grid
        direction={useHorizontal ? 'row' : 'column'}
        alignItems={'center'}
        wrap={'wrap'}
      >
        <MenuIcon onClick={onNewClicked}>
          <AddCircle />
        </MenuIcon>
        <MenuIcon onClick={onOpenClicked}>
          <FolderOpen />
        </MenuIcon>
        <MenuIcon onClick={onSaveClicked}>
          <Save />
        </MenuIcon>
      </Grid>
    </Paper>
  );
};
