import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import { useChannelData } from '@lyricistant/renderer/platform/useChannel';
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
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';

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

  // When we're closed and not animating, position as absolute so that only the
  // button is actually taking up space in the layout. Use position instead of
  // display so that the animation can finish properly.
  const paperPosition = !isExpanded && !isAnimating ? 'absolute' : 'unset';

  const calculateHeight = useCallback(() => {
    if (!isSmallLayout) {
      return 'auto';
    }

    if (!isExpanded && !isAnimating) {
      return 'auto';
    }

    return 'clamp(300px, 450px, 40vh)';
  }, [isExpanded, isSmallLayout]);

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
      display={'flex'}
      flexDirection={'column-reverse'}
      width={isSmallLayout ? '100%' : '400px'}
      minWidth={isSmallLayout ? undefined : '400px'}
      flexShrink={1}
      padding={'16px'}
      gap={'8px'}
    >
      {showToggleButton && (
        <Box display={'flex'} justifyContent={'end'}>
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
      <Slide
        in={isExpanded}
        direction={isSmallLayout ? 'up' : 'left'}
        onEnter={() => setIsAnimating(true)}
        onExited={() => setIsAnimating(false)}
      >
        <Paper
          elevation={1}
          sx={{
            maxHeight: '100%',
            height: calculateHeight(),
            flex: '1 1 auto',
            position: paperPosition,
          }}
        >
          <Box
            display={'flex'}
            flexDirection={'column'}
            height={'100%'}
            width={'100%'}
          >
            <Tabs
              value={tabIndex}
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
                isVisible={tabIndex === 0}
                onLoadingChanged={setLoading}
              />
            </TabbedItem>
            <TabbedItem index={1} selectedIndex={tabIndex}>
              <Dictionary
                {...props.dictionaryProps}
                isVisible={tabIndex === 1}
                onLoadingChanged={setLoading}
              />
            </TabbedItem>
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
};
