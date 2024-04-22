import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';
import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { WordChip } from '@lyricistant/renderer/detail/WordChip';
import {
  Diagnostics,
  DiagnosticsPanelProps,
} from '@lyricistant/renderer/diagnostics/Diagnostics';
import {
  Dictionary,
  DictionaryProps,
} from '@lyricistant/renderer/dictionary/Dictionary';
import {
  useChannel,
  useChannelData,
} from '@lyricistant/renderer/platform/useChannel';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { Rhymes, RhymesProps } from '@lyricistant/renderer/rhymes/Rhymes';
import {
  rhymesMachine,
  RhymesState,
} from '@lyricistant/renderer/rhymes/RhymesMachine';
import { ChevronLeft, ChevronRight, Spellcheck } from '@mui/icons-material';
import {
  Box,
  Fab,
  Fade,
  LinearProgress,
  Paper,
  Slide,
  Tab,
  Tabs,
} from '@mui/material';
import { useMachine } from '@xstate/react';
import {
  BookAlphabet,
  ChevronDown,
  ChevronUp,
  ScriptOutline,
} from 'mdi-material-ui';
import React, {
  ReactElement,
  PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';

interface Button {
  onClick: () => void;
  icon: ReactElement;
}

interface TabChangedData {
  isQueryTab: boolean;
}

interface DetailRhymesProps
  extends Omit<Omit<RhymesProps, 'state'>, keyof DetailPaneChildProps> {
  query?: string;
}

interface DetailPaneProps {
  buttons: Button[];
  rhymeProps: DetailRhymesProps;
  dictionaryProps: Omit<DictionaryProps, keyof DetailPaneChildProps>;
  diagnosticsProps: Omit<DiagnosticsPanelProps, keyof DetailPaneChildProps>;
  onTabChanged: (data: TabChangedData) => void;
}

export interface DetailPaneChildProps {
  isVisible: boolean;
  onLoadingChanged: (isLoading: boolean) => void;
}

type TabbedItemProps = PropsWithChildren<{
  index: number;
  selectedIndex: number;
}>;
const TabbedItem = ({ index, selectedIndex, children }: TabbedItemProps) => (
  <Box
    sx={{
      display: index === selectedIndex ? 'flex' : 'none',
      flexDirection: 'column',
      flex: '1 1 auto',
      overflow: 'auto',
    }}
  >
    <Box flex={'0 0 8px'} />
    <Box flex={'1 1 auto'}>{children}</Box>
    <Box flex={'0 0 8px'} />
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

const DetailButton = (props: Button) => (
  <Fab size={'small'} onClick={() => props.onClick()} color={'primary'}>
    {props.icon}
  </Fab>
);

/**
 * Renders the Rhymes and Dictionary components inside a floating pane that can
 * optionally be toggled so that it disappears and reappears depending on the
 * user's preferences.
 */
export const DetailPane: React.FC<DetailPaneProps> = (props) => {
  const [isLoading, setLoading] = useState(false);
  const [isExpanded, setExpanded] = useState(true);
  const isSmallLayout = useSmallLayout();
  const [preferencesData] = useChannelData('prefs-updated');
  const [isExpandedPaneShowingRhymes, setIsExpandedPaneIsShowingRhymes] =
    // Cheating here 'cause we know the expanded pane always starts by showing the rhymes tab...
    useState(true);
  const [rhymesState, sendRhymesEvent] = useMachine(rhymesMachine);
  const isRhymesVisible = isExpanded ? isExpandedPaneShowingRhymes : true;

  useLayoutEffect(() => {
    if (!isRhymesVisible || !props.rhymeProps || !preferencesData) {
      return;
    }
    sendRhymesEvent({
      type: 'INPUT',
      input: props.rhymeProps.query,
      rhymeSource: preferencesData.rhymeSource,
    });
  }, [props.rhymeProps.query, isRhymesVisible, preferencesData]);

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
    }
  }, [preferencesData?.detailPaneVisibility]);

  // Only show the small rhymes when we're not expanded on the small layout.
  // The large layout doesn't need them.
  const showSmallRhymes = isSmallLayout ? !isExpanded : false;

  return (
    <Box
      width={isSmallLayout ? undefined : '400px'}
      flex={isSmallLayout ? '0 1' : undefined}
    >
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'end'}
        paddingTop={isSmallLayout ? undefined : '16px'}
        paddingLeft={isSmallLayout ? '16px' : undefined}
        paddingRight={'16px'}
        paddingBottom={'16px'}
        height={'100%'}
        width={'100%'}
        gap={'8px'}
      >
        <ExpandedDetailPane
          isExpanded={isExpanded}
          isSmallLayout={isSmallLayout}
          isLoading={isLoading}
          setLoading={setLoading}
          onTabChanged={(data) => {
            props.onTabChanged(data);
            setIsExpandedPaneIsShowingRhymes(data.isRhymesTab);
          }}
          rhymesProps={{
            ...props.rhymeProps,
            state: rhymesState,
          }}
          dictionaryProps={props.dictionaryProps}
          diagnosticsProps={props.diagnosticsProps}
        />
        <Box
          display={'flex'}
          justifyContent={'end'}
          flex={'0 0 auto'}
          gap={'20px'}
        >
          {showSmallRhymes && (
            <ClosedPaneRhymes
              isLoading={isLoading}
              rhymesState={rhymesState}
              onRhymeClicked={props.rhymeProps.onRhymeClicked}
            />
          )}
          {props.buttons.map((button, index) => (
            <DetailButton key={index} {...button} />
          ))}
          {showToggleButton && (
            <Fab
              size={'small'}
              onClick={() => {
                setExpanded(!isExpanded);
              }}
            >
              <ToggleDetailPaneIcon isExpanded={isExpanded} />
            </Fab>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface ClosedPaneRhymesProps {
  isLoading: boolean;
  rhymesState: RhymesState;
  onRhymeClicked: (rhyme: Rhyme) => void;
}
const ClosedPaneRhymes = (props: ClosedPaneRhymesProps) => (
  <Fade in={!props.isLoading}>
    <Box display={'flex'} flex={'1 1'} alignItems={'center'}>
      <Box height={'32px'} overflow={'hidden'} flex={'1 1 auto'}>
        <SingleLineRhymeList
          state={props.rhymesState}
          onClick={props.onRhymeClicked}
        />
      </Box>
    </Box>
  </Fade>
);

const SingleLineRhymeList = ({
  state,
  onClick,
}: {
  state: RhymesState;
  onClick: (rhyme: Rhyme) => void;
}) => {
  const rhymes = state.context.rhymes?.slice(8) ?? [];

  return (
    <Box
      display={'flex'}
      flexWrap={'wrap'}
      gap={'8px'}
      alignContent={'start'}
      flexDirection={'row'}
    >
      {rhymes.map((rhyme) => (
        <WordChip
          word={rhyme.word}
          key={rhyme.word}
          onClick={() => onClick(rhyme)}
        />
      ))}
    </Box>
  );
};

interface ExpandedDetailPaneTabChangedData extends TabChangedData {
  isRhymesTab: boolean;
}
interface ExpandedDetailPaneProps {
  isExpanded: boolean;
  isSmallLayout: boolean;
  isLoading: boolean;
  setLoading: (value: boolean) => void;
  onTabChanged: (data: ExpandedDetailPaneTabChangedData) => void;
  rhymesProps: Omit<RhymesProps, keyof DetailPaneChildProps>;
  dictionaryProps: DetailPaneProps['dictionaryProps'];
  diagnosticsProps: DetailPaneProps['diagnosticsProps'];
}
const ExpandedDetailPane = ({
  isExpanded,
  isSmallLayout,
  isLoading,
  setLoading,
  onTabChanged,
  rhymesProps,
  dictionaryProps,
  diagnosticsProps,
}: ExpandedDetailPaneProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const changeTab = useCallback(
    (index: number) => {
      setTabIndex(index);
      onTabChanged({
        // Rhymes and Dictionary both use a query to show data.
        isQueryTab: index === 0 || index === 1,
        isRhymesTab: index === 0,
      });
    },
    [setTabIndex, onTabChanged]
  );

  useEffect(() => {
    setLoading(false);
  }, [tabIndex]);

  // When we're closed and not animating, position as absolute so that only the
  // button is actually taking up space in the layout. Use position instead of
  // display so that the animation can finish properly.
  const paperDisplay = !isExpanded && !isAnimating ? 'none' : 'unset';

  return (
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
            onChange={(_, newTabIndex) => changeTab(newTabIndex)}
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
            <Tab aria-label={'Diagnostics Tab'} icon={<Spellcheck />} />
          </Tabs>
          <TabbedItem index={0} selectedIndex={tabIndex}>
            <Rhymes
              {...rhymesProps}
              isVisible={tabIndex === 0}
              onLoadingChanged={setLoading}
            />
          </TabbedItem>
          <TabbedItem index={1} selectedIndex={tabIndex}>
            <Dictionary
              {...dictionaryProps}
              isVisible={tabIndex === 1 && isExpanded}
              onLoadingChanged={setLoading}
            />
          </TabbedItem>
          <TabbedItem index={2} selectedIndex={tabIndex}>
            <Diagnostics
              {...diagnosticsProps}
              isVisible={tabIndex === 2 && isExpanded}
              onLoadingChanged={setLoading}
            />
          </TabbedItem>
        </Box>
      </Paper>
    </Slide>
  );
};
