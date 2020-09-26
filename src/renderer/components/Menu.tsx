import { Box, ButtonBase, Paper, Theme } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  AddCircle,
  FolderOpen,
  GetApp,
  Save,
  Settings,
} from '@material-ui/icons';
import clsx from 'clsx';
import { UiConfig } from 'common/ui/UiConfig';
import { platformDelegate } from 'PlatformDelegate';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const useIconStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 56,
    height: 56,
    color: theme.palette.action.active,
    flexShrink: 0,
    display: 'inline-flex',
  },
  icon: {
    width: 24,
    height: 24,
  },
  menu: {
    backgroundColor: theme.palette.primary.main,
  },
}));

const useMenuStyles = makeStyles((theme: Theme) => ({
  menu: {
    backgroundColor: theme.palette.primary.main,
  },
}));

const MenuIcon: FunctionComponent<{ onClick?: () => void }> = ({
  onClick,
  children,
}) => {
  const classes = useIconStyles();
  const [debouncedClick] = useDebouncedCallback(onClick, 200);

  return (
    <ButtonBase className={classes.root} onClick={debouncedClick}>
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
  onSettingsClicked: () => void;
  onDownloadClicked: () => void;
}

export const Menu: FunctionComponent<MenuProps> = ({
  onNewClicked,
  onOpenClicked,
  onSaveClicked,
  onSettingsClicked,
  onDownloadClicked,
  className,
}) => {
  const theme = useTheme();
  const classes = useMenuStyles();
  const useHorizontal = useMediaQuery(theme.breakpoints.down('sm'));
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);

  useEffect(() => {
    const onConfigChange = (config: UiConfig) => {
      setUiConfig(config);
    };

    platformDelegate.on('ui-config', onConfigChange);
    platformDelegate.send('request-ui-config');

    return () => {
      platformDelegate.removeListener('ui-config', onConfigChange);
    };
  }, []);

  return (
    <Paper
      square
      className={clsx(className, classes.menu)}
      color={theme.palette.primary.main}
    >
      <Box
        display={'flex'}
        height={'100%'}
        width={'100%'}
        flexDirection={useHorizontal ? 'row' : 'column'}
      >
        <MenuIcon onClick={onNewClicked}>
          <AddCircle />
        </MenuIcon>
        {uiConfig?.showOpen && (
          <MenuIcon onClick={onOpenClicked}>
            <FolderOpen />
          </MenuIcon>
        )}
        <MenuIcon onClick={onSaveClicked}>
          <Save />
        </MenuIcon>
        <Box flexGrow={'1'} />
        {uiConfig?.showDownload && (
          <MenuIcon onClick={onDownloadClicked}>
            <GetApp />
          </MenuIcon>
        )}
        <MenuIcon onClick={onSettingsClicked}>
          <Settings />
        </MenuIcon>
      </Box>
    </Paper>
  );
};
