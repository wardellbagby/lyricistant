import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import {
  useChannel,
  useChannelData,
} from '@lyricistant/renderer/platform/useChannel';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  Box,
  Fab,
  LinearProgress,
  Paper,
  Slide,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BookAlphabet,
  ChevronDown,
  ChevronUp,
  ScriptOutline,
} from 'mdi-material-ui';
import React, { PropsWithChildren, useEffect, useState } from 'react';

interface DetailPaneProps {
  rhymeProps: Omit<RhymesProps, keyof DetailPaneChildProps>;
  dictionaryProps: Omit<DictionaryProps, keyof DetailPaneChildProps>;
}

export interface DetailPaneChildProps {
  isVisible?: boolean;
  onLoadingChanged?: (isLoading: boolean) => void;
}

type TabbedItemProps = PropsWithChildren<{
  index: number;
  selectedIndex: number;
}>;
const TabbedItem = ({ index, selectedIndex, children }: TabbedItemProps) => (
  <Box
    sx={{
      display: index === selectedIndex ? 'block' : 'none',
      flex: '1 1 auto',
      overflow: 'auto',
    }}
  >
    {children}
  </Box>
);

const ToggleDetailPaneIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  const isSmallLayout = useSmallLayout();
  if (isSmallLayout) {
    if (isExpanded) {
      return <ChevronDown />;
    }
    return <ChevronUp />;
  }
  if (isExpanded) {
    return <ChevronRight />;
  }
  return <ChevronLeft />;
};

/**
 * Renders the Rhymes and Dictionary components inside a floating pane that can
 * optionally be toggled so that it disappears and reappears depending on the
 * user's preferences.
 */
export const DetailPane: React.FC<DetailPaneProps> = (props) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [isExpanded, setExpanded] = useState(true);
  const isSmallLayout = useSmallLayout();
  const [isAnimating, setIsAnimating] = useState(false);
  const [preferencesData] = useChannelData('prefs-updated');

  const showToggleButton =
    preferencesData == null ||
    preferencesData.detailPaneVisibility === DetailPaneVisibility.Toggleable;

  useChannel(
    'show-detail-pane',
    () => {
      if (showToggleButton) {
        setExpanded(true);
      }
    },
    [showToggleButton]
  );

  useChannel(
    'close-detail-pane',
    () => {
      if (showToggleButton) {
        setExpanded(false);
      }
    },
    [showToggleButton]
  );

  // When we're closed and not animating, position as absolute so that only the
  // button is actually taking up space in the layout. Use position instead of
  // display so that the animation can finish properly.
  const paperDisplay = !isExpanded && !isAnimating ? 'none' : 'unset';

  useEffect(() => {
    setLoading(false);
  }, [tabIndex]);

  useEffect(() => {
    if (!isSmallLayout) {
      setExpanded(true);
    }
  }, [isSmallLayout]);

  useEffect(() => {
    if (
      preferencesData?.detailPaneVisibility === DetailPaneVisibility.Always_Show
    ) {
      setExpanded(true);
      setIsAnimating(false);
    }
  }, [preferencesData?.detailPaneVisibility]);

  return (
    <Box
      width={isSmallLayout ? undefined : '400px'}
      flex={isSmallLayout ? '.75 1' : undefined}
    >
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'end'}
        padding={'16px'}
        height={'100%'}
        width={'100%'}
        gap={'8px'}
      >
        <Slide
          in={isExpanded}
          direction={isSmallLayout ? 'up' : 'left'}
          onEnter={() => setIsAnimating(true)}
          onExited={() => setIsAnimating(false)}
        >
          <Paper
            elevation={1}
            sx={{
              minHeight: isSmallLayout ? '250px' : undefined,
              maxHeight: isSmallLayout ? '600px' : undefined,
              flex: '1 1 0',
              display: paperDisplay,
              overflow: 'auto',
            }}
          >
            <Box
              display={'flex'}
              flexDirection={'column'}
              height={'100%'}
              width={'100%'}
            >
              <Tabs
                value={isExpanded ? tabIndex : false}
                onChange={(_, newTabIndex) => setTabIndex(newTabIndex)}
                variant={'fullWidth'}
                sx={{
                  flex: '0 0 auto',
                  boxShadow: 1,
                }}
                TabIndicatorProps={{
                  children: isLoading ? (
                    <LinearProgress variant={'indeterminate'} />
                  ) : undefined,
                }}
              >
                <Tab aria-label={'Rhymes Tab'} icon={<ScriptOutline />} />
                <Tab aria-label={'Dictionary Tab'} icon={<BookAlphabet />} />
              </Tabs>
              <TabbedItem index={0} selectedIndex={tabIndex}>
                <Rhymes
                  {...props.rhymeProps}
                  isVisible={tabIndex === 0 && isExpanded}
                  onLoadingChanged={setLoading}
                />
              </TabbedItem>
              <TabbedItem index={1} selectedIndex={tabIndex}>
                <Dictionary
                  {...props.dictionaryProps}
                  isVisible={tabIndex === 1 && isExpanded}
                  onLoadingChanged={setLoading}
                />
              </TabbedItem>
            </Box>
          </Paper>
        </Slide>
        {showToggleButton && (
          <Box display={'flex'} justifyContent={'end'} flex={'0 0 auto'}>
            <Fab
              size={'small'}
              onClick={() => {
                setExpanded(!isExpanded);
              }}
            >
              <ToggleDetailPaneIcon isExpanded={isExpanded} />
            </Fab>
          </Box>
        )}
      </Box>
    </Box>
  );
};
