import { UiConfig } from '@lyricistant/common/ui/UiConfig';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu as MuiMenu,
  MenuItem,
  Paper,
  SxProps,
  Theme,
  useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  AddCircle,
  FolderOpen,
  GetApp,
  History,
  MoreVert,
  Save,
  Settings,
  SvgIconComponent,
} from '@mui/icons-material';
import React, {
  FunctionComponent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useHistory } from 'react-router-dom';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { downloadApp } from '@lyricistant/renderer/download';
import { useEditorText } from '@lyricistant/renderer/editor/EditorTextStore';

const useMenuStyles = makeStyles<Theme, { isSmallLayout: boolean }>(
  (theme: Theme) => ({
    menu: {
      backgroundColor: theme.palette.background.paper,
      height: (props) => (props.isSmallLayout ? 'auto' : '100%'),
      width: (props) => (props.isSmallLayout ? '100%' : 'auto'),
    },
  })
);

const MenuIcon: FunctionComponent<{
  onClick: (event: MouseEvent) => void;
  ariaLabel: string;
  debounce?: boolean;
  sx?: SxProps;
}> = ({ onClick, ariaLabel, debounce, sx, children }) => {
  const [debouncedClick] = useDebouncedCallback(onClick, 200);

  return (
    <Box
      padding={'8px'}
      aria-label={ariaLabel}
      role={'button'}
      sx={sx}
      onClick={debounce ? debouncedClick : onClick}
    >
      <IconButton>{children}</IconButton>
    </Box>
  );
};

interface OverflowItem {
  icon: SvgIconComponent;
  label: string;
  onClick: () => void;
}

interface AppBarProps {
  direction: 'horizontal' | 'vertical';
  leading: OverflowItem[];
  trailing: OverflowItem[];
}

const toMenuIcon = (item: OverflowItem) => (
  <MenuIcon key={item.label} onClick={item.onClick} ariaLabel={item.label}>
    <item.icon />
  </MenuIcon>
);

const MenuBar = (props: AppBarProps) => {
  const isHorizontal = props.direction === 'horizontal';
  const [anchor, setAnchor] = useState<Element>(null);
  const onMenuClicked = (event: MouseEvent) => setAnchor(event.currentTarget);

  const shouldTrim = useMemo(
    () => props.leading.length > 3 && isHorizontal,
    [props.leading, isHorizontal]
  );

  const leading = useMemo(() => {
    if (shouldTrim) {
      return props.leading.slice(0, 3);
    }
    return props.leading;
  }, [props.leading, shouldTrim]);

  const trailing = useMemo(() => {
    if (shouldTrim) {
      return [...props.leading.slice(3), ...props.trailing];
    }
    return props.trailing;
  }, [props.leading, props.trailing, shouldTrim]);

  useEffect(() => setAnchor(null), [isHorizontal]);

  return (
    <Box
      display={'flex'}
      height={isHorizontal ? 'auto' : '100%'}
      width={isHorizontal ? '100%' : 'auto'}
      flexDirection={isHorizontal ? 'row' : 'column'}
    >
      {leading.map(toMenuIcon)}
      <Box flexGrow={'1'} />
      <MenuIcon
        sx={{ display: isHorizontal ? undefined : 'none' }}
        ariaLabel={'Additional Menu Buttons'}
        onClick={onMenuClicked}
        debounce={false}
      >
        <MoreVert />
      </MenuIcon>
      <MuiMenu
        anchorEl={anchor}
        open={!!anchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setAnchor(null)}
      >
        {trailing.map((item) => (
          <MenuItem
            aria-label={item.label}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </MuiMenu>
      {isHorizontal ? null : trailing.map(toMenuIcon)}
    </Box>
  );
};

export const Menu: React.FC = () => {
  const theme = useTheme();
  const classes = useMenuStyles({ isSmallLayout: useSmallLayout() });
  const [uiConfig, setUiConfig] = useState<UiConfig>(null);
  const editorText = useEditorText();
  const history = useHistory();
  const isSmallLayout = useSmallLayout();
  const direction = isSmallLayout ? 'horizontal' : 'vertical';

  const onNewClicked = () => platformDelegate.send('new-file-attempt');
  const onOpenClicked = () => platformDelegate.send('open-file-attempt');
  const onSaveClicked = useCallback(
    () => platformDelegate.send('save-file-attempt', editorText),
    [editorText]
  );

  const onSettingsClicked = () => history.replace('/preferences');
  const onDownloadClicked = () => {
    if (!downloadApp()) {
      history.replace('/download');
    }
  };
  const onFileHistoryClicked = () => history.replace('/file-history');

  const leadingIcons = useMemo(
    () =>
      [
        {
          label: 'New File',
          icon: AddCircle,
          onClick: onNewClicked,
        },
        uiConfig?.showOpen && {
          label: 'Open File',
          icon: FolderOpen,
          onClick: onOpenClicked,
        },
        {
          label: 'Save File',
          icon: Save,
          onClick: onSaveClicked,
        },
        uiConfig?.showOpen && {
          label: 'View file history',
          icon: History,
          onClick: onFileHistoryClicked,
        },
      ].filter((node) => node),
    [uiConfig, onSaveClicked]
  );
  const trailingIcons = useMemo(
    () =>
      [
        uiConfig?.showDownload && {
          label: 'Download Lyricistant',
          icon: GetApp,
          onClick: onDownloadClicked,
        },
        {
          label: 'Open Preferences',
          icon: Settings,
          onClick: onSettingsClicked,
        },
      ].filter((value) => !!value),
    [uiConfig]
  );

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
    <Box
      marginBottom={isSmallLayout ? '8px' : 'inherit'}
      marginRight={isSmallLayout ? 'inherit' : '8px'}
      boxShadow={1}
    >
      <Paper square className={classes.menu} color={theme.palette.primary.main}>
        <MenuBar
          direction={direction}
          leading={leadingIcons}
          trailing={trailingIcons}
        />
      </Paper>
    </Box>
  );
};
