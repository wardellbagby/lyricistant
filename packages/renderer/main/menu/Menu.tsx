import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
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
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu as MuiMenu,
  MenuItem,
  Paper,
  SxProps,
  useTheme,
} from '@mui/material';
import React, {
  FunctionComponent,
  MouseEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

const MenuIcon: FunctionComponent<{
  onClick: (event: MouseEvent) => void;
  ariaLabel: string;
  debounce?: boolean;
  sx?: SxProps;
}> = ({ onClick, ariaLabel, debounce, sx, children }) => {
  const debouncedClick = useDebouncedCallback(onClick, 200);

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

interface MenuItemData {
  icon: SvgIconComponent;
  label: string;
  onClick: () => void;
}

interface AppBarProps {
  direction: 'horizontal' | 'vertical';
  leading: MenuItemData[];
  trailing: MenuItemData[];
}

const toMenuIcon = (item: MenuItemData) => (
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

  const leading: MenuItemData[] = useMemo(() => {
    if (shouldTrim) {
      return props.leading.slice(0, 3);
    }
    return props.leading;
  }, [props.leading, shouldTrim]);

  const trailing: MenuItemData[] = useMemo(() => {
    if (shouldTrim) {
      return [...props.leading.slice(3), ...props.trailing];
    }
    return props.trailing;
  }, [props.leading, props.trailing, shouldTrim]);

  useEffect(() => {
    setAnchor(null);
  }, [isHorizontal]);

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
            key={item.label}
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

/** The props needed to render {@link Menu}. */
export interface MenuProps {
  /** Invoked when the new button is clicked */
  onNewClicked: () => void;
  /** Invoked when the open button is clicked */
  onOpenClicked: () => void;
  /** Invoked when the save button is clicked */
  onSaveClicked: () => void;
  /** Invoked when the preferences button is clicked */
  onPreferencesClicked: () => void;
  /** Invoked when the download button is clicked */
  onDownloadClicked: () => void;
  /** Invoked when the file history button is clicked */
  onFileHistoryClicked: () => void;
}

/**
 * Renders a menu, which is a list of buttons.
 *
 * When in small layout, this menu renders horizontally. If there are more than
 * 3 buttons, it will show the extras in an overflow menu.
 *
 * When not in small layout, it renders vertically with spacing between the
 * first 4 buttons and the rest of the button.
 *
 * @param props The props needed to render this component.
 */
export const Menu: React.FC<MenuProps> = (props) => {
  const theme = useTheme();
  const [uiConfig] = useChannelData('ui-config');
  const isSmallLayout = useSmallLayout();
  const direction = isSmallLayout ? 'horizontal' : 'vertical';

  const leadingIcons = useMemo(
    () =>
      [
        {
          label: 'New file',
          icon: AddCircle,
          onClick: props.onNewClicked,
        },
        uiConfig?.showOpen && {
          label: 'Open file',
          icon: FolderOpen,
          onClick: props.onOpenClicked,
        },
        {
          label: 'Save file',
          icon: Save,
          onClick: props.onSaveClicked,
        },
        uiConfig?.showOpen && {
          label: 'View file history',
          icon: History,
          onClick: props.onFileHistoryClicked,
        },
      ].filter((node) => node),
    [uiConfig, props]
  );
  const trailingIcons = useMemo(
    () =>
      [
        uiConfig?.showDownload && {
          label: 'Download Lyricistant',
          icon: GetApp,
          onClick: props.onDownloadClicked,
        },
        {
          label: 'Open preferences',
          icon: Settings,
          onClick: props.onPreferencesClicked,
        },
      ].filter((value) => !!value),
    [uiConfig, props]
  );

  return (
    <Box
      paddingTop={'8px'}
      paddingLeft={'8px'}
      paddingRight={isSmallLayout ? '8px' : undefined}
      paddingBottom={isSmallLayout ? undefined : '8px'}
    >
      <Paper
        color={theme.palette.primary.main}
        sx={{
          backgroundColor: theme.palette.background.paper,
          height: isSmallLayout ? 'auto' : '100%',
          width: isSmallLayout ? '100%' : 'auto',
        }}
      >
        <MenuBar
          direction={direction}
          leading={leadingIcons}
          trailing={trailingIcons}
        />
      </Paper>
    </Box>
  );
};
